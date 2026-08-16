export const AnalysisSource = {
  DEMO: 'DEMO',
  VISION: 'VISION',
} as const;

export type AnalysisSource = (typeof AnalysisSource)[keyof typeof AnalysisSource];
