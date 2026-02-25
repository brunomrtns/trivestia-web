"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEvents = validateEvents;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function validateEvents(events, maxEvents, config) {
    const errors = [];
    if (events.length > maxEvents) {
        errors.push(`Muitos eventos: ${events.length} > ${maxEvents}`);
        return { valid: false, errors };
    }
    let lastCandleIndex = -1;
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (event.type === 'PLACE_ORDER') {
            const { order } = event;
            if (!UUID_RE.test(order.id)) {
                errors.push(`Evento ${i}: order.id não é UUIDv4 válido`);
            }
            if (order.candleIndex < 0) {
                errors.push(`Evento ${i}: order.candleIndex deve ser >= 0`);
            }
            if (order.candleIndex < lastCandleIndex) {
                errors.push(`Evento ${i}: ordem não-monotônica (${order.candleIndex} < ${lastCandleIndex})`);
            }
            if (order.quantity <= 0) {
                errors.push(`Evento ${i}: quantity deve ser > 0`);
            }
            if (order.quantity > config.maxPositionSize) {
                errors.push(`Evento ${i}: quantity ${order.quantity} excede maxPositionSize ${config.maxPositionSize}`);
            }
            if ((order.type === 'LIMIT' || order.type === 'STOP') &&
                order.price == null) {
                errors.push(`Evento ${i}: LIMIT/STOP requer price`);
            }
            lastCandleIndex = Math.max(lastCandleIndex, order.candleIndex);
        }
        else if (event.type === 'CANCEL_ORDER') {
            if (event.candleIndex < lastCandleIndex) {
                errors.push(`Evento ${i}: CANCEL_ORDER não-monotônico (${event.candleIndex} < ${lastCandleIndex})`);
            }
            lastCandleIndex = Math.max(lastCandleIndex, event.candleIndex);
        }
        else if (event.type === 'MODIFY_ORDER') {
            if (event.candleIndex < lastCandleIndex) {
                errors.push(`Evento ${i}: MODIFY_ORDER não-monotônico (${event.candleIndex} < ${lastCandleIndex})`);
            }
            lastCandleIndex = Math.max(lastCandleIndex, event.candleIndex);
        }
    }
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=validation.js.map