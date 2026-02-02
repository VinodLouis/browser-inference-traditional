import { BenchmarkResult } from '../types/benchmark';
import { METRICS_CONFIG } from '../utils/constants';
export const exportToCSV = (
  results: BenchmarkResult[],
  modelName: string,
  numSamples: number,
  networkLatencyMode?: string,
): void => {
  const headers = [
    'Metric Category',
    'Metric',
    'Unit',
    ...results.map(
      (eachResult) => `${eachResult.label} (${eachResult.optimization})`,
    ),
    'Interpretation',
  ];

  const rows = [
    // Add network latency info if applicable
    ...(networkLatencyMode && networkLatencyMode !== 'none'
      ? [
          [
            'Network',
            'Latency Mode',
            'string',
            ...results.map((eachResult) =>
              eachResult.label === 'Server' ? networkLatencyMode : 'N/A',
            ),
            'Simulated network conditions',
          ],
        ]
      : []),
    ...METRICS_CONFIG.map(({ category, metric, unit, key, interpretation }) => {
      const values = results.map((eachResult) => {
        const value = eachResult[key as keyof BenchmarkResult];
        return typeof value === 'number' ? value.toFixed(2) : value;
      });
      return [category, metric, unit, ...values, interpretation];
    }),
  ];

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${modelName}_${numSamples}_${new Date()
    .toLocaleString()
    .split(',')
    .map((e) => e.trim())
    .join('_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
