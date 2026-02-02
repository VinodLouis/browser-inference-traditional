import { BenchmarkResult } from '../types/benchmark';
import { METRICS_CONFIG } from '../utils/constants';

interface ResultsDisplayProps {
  results: BenchmarkResult[] | null;
  error: string | null;
}

function formatVal(val: unknown, unit: string): string {
  if (typeof val === 'number') {
    return unit === '0-1' ? val.toFixed(3) : val.toFixed(2);
  }
  return String(val ?? '');
}

interface MetricRowProps {
  category: string;
  metric: string;
  unit: string;
  interpretation: string;
  values: { id: string; value: string }[];
}
function MetricRow({
  category,
  metric,
  unit,
  interpretation,
  values,
}: MetricRowProps) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-4 py-2 text-sm text-gray-600">{category}</td>
      <td className="px-4 py-2 text-sm font-medium">{metric}</td>
      <td className="px-4 py-2 text-sm text-gray-500">{unit}</td>
      {values.map((v) => (
        <td className="px-4 py-2 text-sm text-right font-mono" key={v.id}>
          {v.value}
        </td>
      ))}
      <td className="px-4 py-2 text-sm text-gray-600">{interpretation}</td>
    </tr>
  );
}

export function ResultsDisplay({ results, error }: ResultsDisplayProps) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-red-800">Error</h3>
        <p className="text-sm text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  if (!results) {
    return <></>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        📊 Detailed Metrics
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Category
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Metric
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Unit
              </th>
              {results.map((eachResult, key) => (
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  {eachResult.label} ({eachResult.optimization})
                </th>
              ))}
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Interpretation
              </th>
            </tr>
          </thead>
          <tbody>
            {METRICS_CONFIG.map((m) => (
              <MetricRow
                key={`${m.category}-${m.metric}`}
                category={m.category}
                metric={m.metric}
                unit={m.unit}
                interpretation={m.metric}
                values={results.map((r) => ({
                  id: `${r.label}-${r.optimization}`,
                  value: formatVal(r[m.key as keyof BenchmarkResult], m.unit),
                }))}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
