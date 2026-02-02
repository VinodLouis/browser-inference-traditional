import { BenchmarkForm } from './BenchmarkForm';
import { ResultsDisplay } from './ResultsDisplay';
import { useBenchmark } from '../hooks/useBenchmark';
import { PerformanceComparison } from './PerformanceComparison';
import { NetworkLatencyInfo } from './NetworkLatencyInfo';
import { exportToCSV } from '../utils/csvExporter';

export function ComparisonChart() {
  const {
    results,
    comparisonResults,
    loading,
    error,
    progress,
    runAllBenchmarks,
    rtt,
  } = useBenchmark();

  const handleExport = (
    modelName: string,
    numSamples: number,
    networkRTT: string,
  ): void => {
    if (results) {
      exportToCSV(results, modelName, numSamples, networkRTT);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          ML Inference Benchmark
        </h1>
        <p className="text-lg text-gray-600">
          Compare browser and server inference performance with dynamic network
          configurations
        </p>
      </div>
      <BenchmarkForm
        onAllBenchmarks={runAllBenchmarks}
        loading={loading}
        success={!!comparisonResults}
        handleExport={(modelName, numSamples, networkRTT) =>
          handleExport(modelName, numSamples, networkRTT)
        }
      />

      {progress && (
        <div className="mb-6 p-4 bg-white border-l-4 border-blue-500 rounded-lg shadow">
          <p className="text-sm font-medium text-gray-700">{progress}</p>
        </div>
      )}
      {comparisonResults && (
        <>
          <PerformanceComparison results={comparisonResults} />
          <NetworkLatencyInfo
            results={comparisonResults}
            networkLatencyMode={rtt}
          />
        </>
      )}

      <ResultsDisplay results={results} error={error} />
    </div>
  );
}
