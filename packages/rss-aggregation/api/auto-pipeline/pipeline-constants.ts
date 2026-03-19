/**
 * Shared constants and types for the RSS aggregation pipeline.
 */

export const PIPELINE_STATE = {
    PENDING: 'pending',
    CLASSIFYING: 'classifying',
    CLASSIFIED: 'classified',
    GENERATING: 'generating',
    GENERATED: 'generated',
    POSTING: 'posting',
    DONE: 'done',
    FAILED: 'failed',
    REJECTED: 'rejected',
} as const;

export type PipelineState = typeof PIPELINE_STATE[keyof typeof PIPELINE_STATE];

export interface PipelineLogger {
    log(rawId: string, message: string): void;
    error(rawId: string, message: string): void;
}

export interface GeneratedContent {
    title: string;
    content: string;
    tags: string[];
    categories: string[];
}
