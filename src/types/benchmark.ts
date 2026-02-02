export interface Accuracy {
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
}

export interface Efficiency {
  avg_inference_latency_ms: number;
  min_inference_latency_ms: number;
  max_inference_latency_ms: number;
  median_inference_latency_ms: number;
  p95_inference_latency_ms: number;
  p99_inference_latency_ms: number;
  std_dev_inference_ms: number;
  cold_inference_latency_ms: number;
  warm_inference_latency_ms: number;
  throughput_samples_per_sec: number;
  peak_memory_mb: number;
  avg_memory_mb: number;
  cpu_utilization_percent: number;
}

export interface UX {
  end_to_end_latency_ms: number;
  time_to_first_result_ms: number;
  responsiveness_score: number;
  ui_smooth_score: number;
  frame_drops: number;
  ui_freeze_count: number;
  ui_freeze_duration_ms: number;
  jitter_ms: number;
}

export interface NetworkMetrics {
  rtt_ms: number;
  http_request_overhead_ms: number;
  http_response_overhead_ms: number;
  serialization_ms: number;
  total_api_latency_ms: number;
}

export interface Metadata {
  num_samples: number;
  total_inference_time_ms: number;
  browser_version: string;
  platform: string;
  dynamic_metrics_enabled: boolean;
  memory_api_available: boolean;
  performanceobserver_available: boolean;
}

export interface BenchmarkResult extends Metrics {
  model: string;
  optimization: string;
  num_samples: number;
  timestamp: number;
}

export interface ComparisonResultMetric {
  mode: 'browser' | 'server';
  value: number | string;
  optimization: string;
}

export interface ComparisonResult {
  latency: ComparisonResultMetric;
  throughput: ComparisonResultMetric;
  memory: ComparisonResultMetric;
  bestLatencyServer: ComparisonResultMetric;
  bestLatencyBrowser: ComparisonResultMetric;
}

export interface BenchmarkConfig {
  modelName: string;
  numSamples: number;
  optimization: string;
}

export interface InferenceMeasurement {
  latency: number;
  timestamp: number;
  memoryDelta: number;
  error?: string;
  output?: any;
  predictions?: number[];
  batchSize?: any;
}

export interface Metrics {
  label: string;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  medianLatency: number;
  p95Latency: number;
  p99Latency: number;
  stdDev: number;
  coldLatency: number;
  warmLatency: number;
  throughput: number;
  avgMemory: number;
  peakMemory: number;
  endToEndLatency: number;
  timeToFirst: number;
  jitter: number;
  rtt: number;
  timestamp: number;
  platform: string;
  browserVersion: string;
  totalIterations: number;
  successRate: string;
}
