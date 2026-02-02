import { useState } from 'react';
import { BenchmarkResult, ComparisonResult } from '../types/benchmark';
import { browserBenchmark, serverBenchmark } from '../utils/benchmark';
import { NetworkLatencyMode } from '../types/network';
import { computeComparison } from '../utils/metricsCalculator';

interface UseBenchmarkReturn {
  results: BenchmarkResult[] | null;
  comparisonResults: ComparisonResult | null;
  loading: boolean;
  error: string | null;
  progress: string;
  rtt: NetworkLatencyMode;
  setProgress: (progress: string) => void;
  runAllBenchmarks: (
    modelName: string,
    numSamples: number,
    networkRTT: NetworkLatencyMode,
  ) => Promise<void>;
  clearResults: () => void;
}

export function useBenchmark(): UseBenchmarkReturn {
  const [results, setResults] = useState<BenchmarkResult[] | null>(null);
  const [comparisonResults, setComparisonResults] =
    useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [rtt, setRtt] = useState<NetworkLatencyMode>('wifi');

  // const runBrowserBenchmark = async (
  //   modelName: string,
  //   numSamples: number,
  //   optimization: string,
  // ) => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const result = await browserBenchmark.benchmark(
  //       modelName,
  //       numSamples,
  //       optimization,
  //     );
  //     setResults(result);
  //   } catch (err) {
  //     const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  //     setError(errorMessage);
  //     console.error('Benchmark error:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const runServerBenchmark = async (
  //   modelName: string,
  //   numSamples: number,
  //   optimization: string,
  //   networkRTT: NetworkRTT,
  // ) => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     serverBenchmark.setNetworkRTT(networkRTT);
  //     const result = await serverBenchmark.benchmark(
  //       modelName,
  //       numSamples,
  //       optimization,
  //     );
  //     setResults(result);
  //   } catch (err) {
  //     const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  //     setError(errorMessage);
  //     console.error('Server benchmark error:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const runAllBenchmarks = async (
    modelName: string,
    numSamples: number,
    networkRTT: NetworkLatencyMode,
  ) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setProgress('');
    setRtt(networkRTT);
    try {
      serverBenchmark.setNetworkRTT(networkRTT);

      const inferenceResults: BenchmarkResult[] = [];
      setProgress('Running server benchmarks...');
      for (const eachOptimization of ['cpu', 'mps']) {
        setProgress(`Running server benchmark: ${eachOptimization}...`);
        const serverResult = await serverBenchmark.benchmark(
          modelName,
          numSamples,
          eachOptimization,
          (completed) =>
            setProgress(
              `Server: [${eachOptimization}] ${completed}/${numSamples} tests complete`,
            ),
        );
        setProgress(`Server benchmark complete.`);
        inferenceResults.push({
          ...serverResult,
          model: modelName,
          optimization: eachOptimization,
          num_samples: numSamples,
          timestamp: Date.now(),
        });
      }
      setProgress('Running client benchmarks...');
      for (const eachOptimization of [
        'none',
        'webgl',
        'webgpu',
        'wasm_simd',
        'webnn',
      ]) {
        setProgress(`Running client benchmark: ${eachOptimization}...`);
        const browserResult = await browserBenchmark.benchmark(
          modelName,
          numSamples,
          eachOptimization,
          (completed) =>
            setProgress(
              `Client: [${eachOptimization}] ${completed}/${numSamples} tests complete`,
            ),
        );
        setProgress(`Client benchmark complete.`);
        inferenceResults.push({
          ...browserResult,
          model: modelName,
          optimization: eachOptimization,
          num_samples: numSamples,
          timestamp: Date.now(),
        });
      }
      const comparison: ComparisonResult = computeComparison(inferenceResults);
      setProgress(`Benchmark complete!`);
      setResults(inferenceResults);
      setComparisonResults(comparison);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Benchmark error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
    setProgress('');
  };

  return {
    results,
    comparisonResults,
    loading,
    error,
    progress,
    rtt,
    setProgress,
    runAllBenchmarks,
    clearResults,
  };
}
