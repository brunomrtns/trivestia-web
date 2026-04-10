import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { simulationEndpoints } from '@/services/endpoints/simulation.endpoints';
import { SimTradingTerminal } from '@/components/sim-trading/SimTradingTerminal';
import { ChallengeBriefingScreen } from '@/components/sim-trading/ChallengeBriefingScreen';
import { HelpDrawer } from '@/components/sim-trading/HelpDrawer';
import { useTutorialProgress } from '@/components/sim-trading/useTutorialProgress';
import { ActivityErrorState } from './ActivityErrorState';

type ChallengePhase = 'BRIEFING' | 'TERMINAL';

interface SimTradingChallengeActivityFlowProps {
  slug: string;
  activityId: string;
  onExit: () => void;
}

export function SimTradingChallengeActivityFlow({
  slug,
  activityId,
  onExit
}: SimTradingChallengeActivityFlowProps) {
  const [phase, setPhase] = useState<ChallengePhase>('BRIEFING');
  const [helpOpen, setHelpOpen] = useState(false);
  const tutorial = useTutorialProgress();

  useEffect(() => {
    setPhase('BRIEFING');
    setHelpOpen(false);
  }, [activityId]);

  const handleExit = useCallback(() => {
    // Ensure local modal/phase state is fully reset before leaving this route.
    setHelpOpen(false);
    setPhase('BRIEFING');
    onExit();
  }, [onExit]);

  const briefingQuery = useQuery({
    queryKey: ['challenge-briefing', slug, activityId],
    queryFn: () => simulationEndpoints.getChallengeBriefing(slug, activityId),
    retry: false
  });

  if (briefingQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (briefingQuery.error || !briefingQuery.data) {
    return (
      <ActivityErrorState
        title="Não foi possível carregar o desafio"
        description="O desafio de sim trading não está disponível no momento."
        primaryLabel="Voltar para a aula"
        onPrimary={handleExit}
      />
    );
  }

  const briefing = briefingQuery.data;

  if (phase === 'BRIEFING') {
    return (
      <>
        <ChallengeBriefingScreen
          briefing={briefing}
          onStart={() => setPhase('TERMINAL')}
          onGoBack={handleExit}
          onOpenHelp={() => setHelpOpen(true)}
        />
        <HelpDrawer
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          onRestartTutorial={tutorial.restart}
        />
      </>
    );
  }

  return (
    <SimTradingTerminal
      slug={slug}
      mode="CHALLENGE"
      activityId={activityId}
      onComplete={handleExit}
      onOpenHelp={() => setHelpOpen(true)}
      showOnboarding={!tutorial.completed}
      allowSymbolSwitching={briefing.allowSymbolSwitching}
      supportedSymbols={briefing.supportedSymbols}
      onSymbolSwitch={
        briefing.allowSymbolSwitching
          ? async (symbol: string) => {
              const result = await simulationEndpoints.getChallengeScenario(
                slug,
                activityId,
                symbol
              );
              return {
                candles: result.candles,
                executionConfig: result.executionConfig,
                scenarioToken: result.scenarioToken,
                scoringConfig: result.scoringConfig
              };
            }
          : undefined
      }
    />
  );
}
