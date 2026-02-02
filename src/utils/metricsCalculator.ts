import {
  BenchmarkResult,
  ComparisonResult,
  InferenceMeasurement,
  Metrics,
} from '../types/benchmark';

export const calculateMetrics = (
  measurements: InferenceMeasurement[],
  label: string,
  accuracyMetrics: any,
): Metrics => {
  const latencies = measurements.map((m) => m.latency);
  const sorted = [...latencies].sort((a, b) => a - b);
  console.log(latencies, sorted, label);
  const sum = latencies.reduce((a, b) => a + b, 0);
  const mean = sum / latencies.length;
  const variance =
    latencies.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / latencies.length;
  const stdDev = Math.sqrt(variance);
  const successCount = measurements.filter(
    (m) => m.predictions != null || m.predictions != undefined,
  ).length;
  const totalMemory = measurements.reduce((a, b) => a + b.memoryDelta, 0);
  return {
    label,
    precision: accuracyMetrics.precision,
    recall: accuracyMetrics.recall,
    f1Score: accuracyMetrics.f1Score,
    rocAuc: accuracyMetrics.rocAuc,
    avgLatency: mean,
    minLatency: sorted[0] ?? 0,
    maxLatency: sorted[sorted.length - 1] ?? 0,
    medianLatency: sorted[Math.floor(sorted.length / 2)] ?? 0,
    p95Latency: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
    p99Latency: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
    stdDev: stdDev,
    coldLatency: measurements[0]?.latency ?? 0,
    warmLatency:
      measurements.length > 1
        ? measurements.slice(1).reduce((a, b) => a + b.latency, 0) /
          (measurements.length - 1)
        : 0,
    throughput: 1000 / mean,
    avgMemory: totalMemory / measurements.length / (1024 * 1024),
    peakMemory:
      Math.max(...measurements.map((m) => m.memoryDelta)) / (1024 * 1024),
    endToEndLatency: sum,
    timeToFirst: measurements[0]?.latency ?? 0,
    jitter: stdDev,
    rtt: label === 'Server' ? mean : 0,
    timestamp: Date.now(),
    platform: navigator.platform,
    browserVersion: navigator.userAgent,
    totalIterations: measurements.length,
    successRate: ((successCount / measurements.length) * 100).toFixed(2) + '%',
  };
};

export const computeComparison = (
  result: BenchmarkResult[],
): ComparisonResult => {
  // Best Latency overALL
  const bestLatencyBrowser = result.reduce((min, row) =>
    row.label == 'Browser' && row.avgLatency < min.avgLatency ? row : min,
  );

  const bestLatencyServer = result.reduce((min, row) =>
    row.label == 'Server' && row.avgLatency < min.avgLatency ? row : min,
  );

  const bestOverAll =
    bestLatencyBrowser.avgLatency < bestLatencyServer.avgLatency
      ? bestLatencyBrowser
      : bestLatencyServer;

  const bestThroughput = result.reduce((max, row) =>
    row.throughput > max.throughput ? row : max,
  );

  const bestMemory = result.reduce((min, row) =>
    row.avgMemory < min.avgMemory ? row : min,
  );

  return {
    latency: {
      mode: bestOverAll.label.toLowerCase() as 'browser' | 'server',
      value: bestOverAll.avgLatency,
      optimization: bestOverAll.optimization,
    },
    throughput: {
      mode: bestThroughput.label.toLowerCase() as 'browser' | 'server',
      value: bestThroughput.throughput,
      optimization: bestThroughput.optimization,
    },
    memory: {
      mode: bestMemory.label.toLowerCase() as 'browser' | 'server',
      value: bestMemory.avgMemory,
      optimization: bestMemory.optimization,
    },
    bestLatencyServer: {
      mode: 'server',
      value: bestLatencyServer.avgLatency,
      optimization: bestLatencyServer.optimization,
    },
    bestLatencyBrowser: {
      mode: 'browser',
      value: bestLatencyBrowser.avgLatency,
      optimization: bestLatencyBrowser.optimization,
    },
  };
};
