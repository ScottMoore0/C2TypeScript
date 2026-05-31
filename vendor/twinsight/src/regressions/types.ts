export interface RegressionConfig {
  durationThresholdRatio: number;
}

export interface PreviousRunLookup {
  runId: string;
  resultPath: string;
}
