import type { SimEvent, ExecutionConfig } from './types';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export declare function validateEvents(events: SimEvent[], maxEvents: number, config: ExecutionConfig): ValidationResult;
//# sourceMappingURL=validation.d.ts.map