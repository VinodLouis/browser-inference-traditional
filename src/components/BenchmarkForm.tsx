import React, { useState } from 'react';
import { NetworkLatencyMode, NETWORK_LATENCY_CONFIGS } from '../types/network';
import { MODELS, SAMPLE_COUNTS } from '../utils/constants';
import { Download, Play } from 'lucide-react';

interface BenchmarkFormProps {
  onAllBenchmarks: (
    modelName: string,
    numSamples: number,
    networkRTT: NetworkLatencyMode,
  ) => void;
  loading: boolean;
  success?: boolean;
  handleExport: (
    modelName: string,
    numSamples: number,
    networkRTT: NetworkLatencyMode,
  ) => void;
}

export function BenchmarkForm({
  onAllBenchmarks,
  handleExport,
  loading,
  success,
}: BenchmarkFormProps) {
  const [modelName, setModelName] = useState('mobilenetv2');
  const [numSamples, setNumSamples] = useState(50);
  const [networkRTT, setNetworkRTT] = useState<NetworkLatencyMode>('wifi');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAllBenchmarks(modelName, numSamples, networkRTT);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sample Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Samples
            </label>
            <select
              value={numSamples}
              onChange={(e) => setNumSamples(parseInt(e.target.value))}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {SAMPLE_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Network Latency Simulation
            </label>
            <select
              value={networkRTT}
              onChange={(e) =>
                setNetworkRTT(e.target.value as NetworkLatencyMode)
              }
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {Object.values(NETWORK_LATENCY_CONFIGS).map((latency) => (
                <option key={latency.mode} value={latency.mode}>
                  {latency.label} ({latency.latency}ms)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {NETWORK_LATENCY_CONFIGS[networkRTT].description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium shadow-lg"
        >
          <Play className="w-5 h-5" />
          Start Benchmark
        </button>

        {success && (
          <button
            onClick={() => handleExport(modelName, numSamples, networkRTT)}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-lg"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        )}
      </div>
    </>
  );
}
