import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  generateCandleSeries,
  SimulationEngine,
  replaySimulation,
  computeStateHash,
  validateEvents
} from '@trivestia/sim-core';
import type {
  Candle,
  ScenarioPayload,
  SimEvent,
  OrderRequest,
  SimulationState,
  SimulationResult,
  ExecutionConfig
} from '@/types/api';
import { simulationEndpoints } from '@/services/endpoints/simulation.endpoints';
import type {
  ChallengeSubmitResponse,
  PracticeSubmitResponse
} from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SimPhase =
  | 'LOADING'
  | 'READY'
  | 'PLAYING'
  | 'PAUSED'
  | 'FINISHED'
  | 'SUBMITTING'
  | 'RESULT';

export interface SimEngineState {
  phase: SimPhase;
  candles: Candle[];
  visibleCount: number; // candles revealed so far
  scenario: ScenarioPayload | null;
  token: string;
  events: SimEvent[];
  engineState: SimulationState | null;
  result: SimulationResult | null;
  submitResult: ChallengeSubmitResponse | PracticeSubmitResponse | null;
  error: string | null;
}

type Action =
  | {
      type: 'LOADED';
      candles: Candle[];
      scenario: ScenarioPayload;
      token: string;
      initialState: SimulationState;
    }
  | { type: 'SET_PHASE'; phase: SimPhase }
  | { type: 'ADVANCE'; newState: SimulationState }
  | { type: 'JUMP'; index: number; newState: SimulationState }
  | { type: 'ADD_EVENT'; event: SimEvent; newState: SimulationState }
  | { type: 'FINISH'; result: SimulationResult }
  | {
      type: 'SUBMITTED';
      submitResult: ChallengeSubmitResponse | PracticeSubmitResponse;
    }
  | { type: 'ERROR'; message: string };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: SimEngineState, action: Action): SimEngineState {
  switch (action.type) {
    case 'LOADED':
      return {
        ...state,
        phase: 'READY',
        candles: action.candles,
        scenario: action.scenario,
        token: action.token,
        engineState: action.initialState,
        visibleCount: 1,
        events: [],
        result: null,
        submitResult: null,
        error: null
      };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'ADVANCE':
      return {
        ...state,
        visibleCount: Math.min(state.visibleCount + 1, state.candles.length),
        engineState: action.newState
      };
    case 'JUMP':
      return {
        ...state,
        visibleCount: action.index,
        engineState: action.newState
      };
    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, action.event],
        engineState: action.newState
      };
    case 'FINISH':
      return { ...state, phase: 'FINISHED', result: action.result };
    case 'SUBMITTED':
      return { ...state, phase: 'RESULT', submitResult: action.submitResult };
    case 'ERROR':
      return { ...state, phase: 'READY', error: action.message };
    default:
      return state;
  }
}

const INITIAL: SimEngineState = {
  phase: 'LOADING',
  candles: [],
  visibleCount: 1,
  scenario: null,
  token: '',
  events: [],
  engineState: null,
  result: null,
  submitResult: null,
  error: null
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseSimEngineOptions {
  slug: string;
  mode: 'CHALLENGE' | 'PRACTICE';
  activityId?: string; // CHALLENGE only
  practiceToken?: string; // PRACTICE only — passed after createScenario
  practiceCandles?: Candle[]; // PRACTICE only
  practiceScenario?: ScenarioPayload; // PRACTICE only
  executionConfig?: ExecutionConfig; // override for PRACTICE
  onComplete?: () => void;
}

export function useSimEngine({
  slug,
  mode,
  activityId,
  practiceToken,
  practiceCandles,
  practiceScenario,
  onComplete
}: UseSimEngineOptions) {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const engineRef = useRef<SimulationEngine | null>(null);

  // ─── Bootstrap ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (mode === 'CHALLENGE' && activityId) {
      simulationEndpoints
        .getChallengeScenario(slug, activityId)
        .then((scenario) => {
          const eng = new SimulationEngine(
            scenario.candles,
            scenario.executionConfig
          );
          engineRef.current = eng;
          dispatch({
            type: 'LOADED',
            candles: scenario.candles,
            scenario,
            token: scenario.scenarioToken,
            initialState: eng.getState()
          });
        })
        .catch((err) => {
          const msg =
            err?.response?.status === 409
              ? 'ALREADY_PASSED'
              : (err?.response?.data?.error ?? t('sim.engine.loadError'));
          dispatch({ type: 'ERROR', message: msg });
        });
    }
  }, [mode, activityId]);

  useEffect(() => {
    if (
      mode === 'PRACTICE' &&
      practiceToken &&
      practiceCandles &&
      practiceScenario
    ) {
      const eng = new SimulationEngine(
        practiceCandles,
        practiceScenario.executionConfig
      );
      engineRef.current = eng;
      dispatch({
        type: 'LOADED',
        candles: practiceCandles,
        scenario: practiceScenario,
        token: practiceToken,
        initialState: eng.getState()
      });
    }
  }, [mode, practiceToken, practiceCandles, practiceScenario]);

  // ─── Advance one candle ──────────────────────────────────────────────────────

  const advanceCandle = useCallback(() => {
    if (!engineRef.current || !state.scenario) return;
    const { candles, visibleCount } = state;
    if (visibleCount >= candles.length) {
      // Não há mais candles: calcular resultado final
      const result = replaySimulation(
        candles,
        state.events,
        state.scenario.executionConfig
      );
      dispatch({ type: 'FINISH', result });
      return;
    }
    // advanceCandle auto force-closes on last candle
    engineRef.current.advanceCandle(visibleCount);
    const newState = engineRef.current.getState();
    const isLast = visibleCount + 1 >= candles.length;
    if (isLast) {
      const result = replaySimulation(
        candles,
        state.events,
        state.scenario.executionConfig
      );
      dispatch({ type: 'ADVANCE', newState });
      dispatch({ type: 'FINISH', result });
    } else {
      dispatch({ type: 'ADVANCE', newState });
    }
  }, [state]);

  const jumpTo = useCallback(
    (targetIndex: number) => {
      if (
        !state.scenario ||
        targetIndex < 1 ||
        targetIndex > state.candles.length ||
        !engineRef.current
      )
        return;

      // Optimization: if jumping forward, just advance from current
      if (targetIndex >= state.visibleCount) {
        const diff = targetIndex - state.visibleCount;
        if (diff === 0) return;

        for (let i = state.visibleCount; i < targetIndex; i++) {
          // Process any events that happened at this index
          const eventsAtThisIndex = state.events.filter((e) => {
            if (e.type === 'PLACE_ORDER') return e.order.candleIndex === i;
            if (e.type === 'CANCEL_ORDER' || e.type === 'MODIFY_ORDER')
              return e.candleIndex === i;
            return false;
          });
          eventsAtThisIndex.forEach((e) => engineRef.current!.processEvent(e, i));
          engineRef.current.advanceCandle(i);
        }

        const newState = engineRef.current.getState();
        dispatch({ type: 'JUMP', index: targetIndex, newState });
        return;
      }

      // If jumping backward, we must reset and replay
      // 1. Re-instantiate engine to reset state
      const eng = new SimulationEngine(
        state.candles,
        state.scenario.executionConfig
      );

      // 2. Replay all events and candles up to targetIndex
      for (let i = 0; i < targetIndex; i++) {
        const eventsAtThisCandle = state.events.filter((e) => {
          if (e.type === 'PLACE_ORDER') return e.order.candleIndex === i;
          if (e.type === 'CANCEL_ORDER' || e.type === 'MODIFY_ORDER')
            return e.candleIndex === i;
          return false;
        });

        eventsAtThisCandle.forEach((e) => eng.processEvent(e, i));

        if (i > 0) {
          eng.advanceCandle(i);
        }
      }

      engineRef.current = eng;
      const newState = eng.getState();
      dispatch({ type: 'JUMP', index: targetIndex, newState });
    },
    [state]
  );

  const jumpToTimestamp = useCallback(
    (timestamp: number) => {
      if (!state.candles.length) return;
      const index = state.candles.findIndex((c) => c.time >= timestamp);
      if (index !== -1) {
        jumpTo(index + 1);
      }
    },
    [state.candles, jumpTo]
  );

  const jumpForwardSteps = useCallback(
    (steps: number) => {
      jumpTo(Math.min(state.candles.length, state.visibleCount + steps));
    },
    [jumpTo, state.candles.length, state.visibleCount]
  );

  const jumpBackwardSteps = useCallback(
    (steps: number) => {
      jumpTo(Math.max(1, state.visibleCount - steps));
    },
    [jumpTo, state.visibleCount]
  );

  const stepBack = useCallback(() => {
    jumpTo(Math.max(1, state.visibleCount - 1));
  }, [jumpTo, state.visibleCount]);

  const skipToEnd = useCallback(() => {
    if (!engineRef.current || !state.scenario) return;
    const { candles, visibleCount } = state;
    for (let i = visibleCount; i < candles.length; i++) {
      engineRef.current.advanceCandle(i);
    }
    const result = replaySimulation(
      candles,
      state.events,
      state.scenario.executionConfig
    );
    dispatch({ type: 'FINISH', result });
  }, [state]);

  // ─── Place order ─────────────────────────────────────────────────────────────

  const placeOrder = useCallback(
    (orderReq: Omit<OrderRequest, 'candleIndex'>) => {
      if (!engineRef.current || !state.scenario) return;
      const candleIndex = state.visibleCount - 1;
      const order: OrderRequest = { ...orderReq, candleIndex };

      // Validate single event
      const validation = validateEvents(
        [{ type: 'PLACE_ORDER', order }],
        state.scenario.maxEvents - state.events.length,
        state.scenario.executionConfig
      );
      if (!validation.valid) {
        dispatch({ type: 'ERROR', message: validation.errors[0] });
        return;
      }

      engineRef.current.processEvent(
        { type: 'PLACE_ORDER', order },
        candleIndex
      );
      const newState = engineRef.current.getState();
      const event: SimEvent = { type: 'PLACE_ORDER', order };
      dispatch({ type: 'ADD_EVENT', event, newState });
    },
    [state]
  );

  const cancelOrder = useCallback(
    (orderId: string) => {
      if (!engineRef.current) return;
      const candleIndex = state.visibleCount - 1;
      engineRef.current.processEvent(
        { type: 'CANCEL_ORDER', orderId, candleIndex },
        candleIndex
      );
      const newState = engineRef.current.getState();
      const event: SimEvent = { type: 'CANCEL_ORDER', orderId, candleIndex };
      dispatch({ type: 'ADD_EVENT', event, newState });
    },
    [state]
  );

  const closePosition = useCallback(() => {
    if (!engineRef.current || !state.engineState) return;
    const pos = state.engineState.position;
    if (pos.side === 'FLAT') return;
    const candleIndex = state.visibleCount - 1;
    const qty = pos.quantity;
    const side = pos.side === 'LONG' ? 'SELL' : 'BUY';
    const order: OrderRequest = {
      id: crypto.randomUUID(),
      side,
      type: 'MARKET',
      quantity: qty,
      candleIndex
    };
    engineRef.current.processEvent({ type: 'PLACE_ORDER', order }, candleIndex);
    const newState = engineRef.current.getState();
    const event: SimEvent = { type: 'PLACE_ORDER', order };
    dispatch({ type: 'ADD_EVENT', event, newState });
  }, [state]);

  const updateProtection = useCallback(
    (sl?: number, tp?: number) => {
      if (!engineRef.current) return;
      (engineRef.current as any).updateProtection(sl, tp);
      const newState = engineRef.current.getState();
      dispatch({ type: 'ADVANCE', newState }); // Reuse ADVANCE to trigger UI update
    },
    [dispatch]
  );

  // ─── Submit ───────────────────────────────────────────────────────────────────

  const submit = useCallback(async () => {
    if (!state.result || !state.scenario) return;
    dispatch({ type: 'SET_PHASE', phase: 'SUBMITTING' });

    const clientStateHash = computeStateHash({
      finalBalance: state.result.finalBalance,
      totalPnl: state.result.totalPnl,
      fills: state.result.fills.length
    });

    try {
      if (mode === 'CHALLENGE') {
        const res = await simulationEndpoints.submitChallenge(slug, {
          scenarioToken: state.token,
          events: state.events,
          clientStateHash
        });
        dispatch({ type: 'SUBMITTED', submitResult: res });
      } else {
        const res = await simulationEndpoints.submitPractice(slug, {
          scenarioToken: state.token,
          events: state.events,
          clientStateHash
        });
        dispatch({ type: 'SUBMITTED', submitResult: res });
      }
      onComplete?.();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? t('sim.engine.submitError');
      dispatch({ type: 'ERROR', message: msg });
    }
  }, [state, mode, onComplete]);

  const setPhase = useCallback((phase: SimPhase) => {
    dispatch({ type: 'SET_PHASE', phase });
  }, []);

  return {
    ...state,
    advanceCandle,
    stepBack,
    jumpTo,
    jumpToTimestamp,
    jumpForwardSteps,
    jumpBackwardSteps,
    skipToEnd,
    placeOrder,
    cancelOrder,
    closePosition,
    updateProtection,
    submit,
    setPhase
  };
}
