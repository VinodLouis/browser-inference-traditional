import React from 'react';
import { Zap, TrendingUp, Globe } from 'lucide-react';
import { ComparisonResult } from '../types/benchmark';

export const PerformanceComparison: React.FC<{ results: ComparisonResult }> = ({
  results,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 shadow-xl">
      <h2 className="text-2xl font-bold mb-4">Optimal Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5" />
            <p className="text-sm font-medium">Latency</p>
          </div>
          <p className="text-3xl font-bold">
            {(results.latency.value as number).toFixed(2)}
          </p>
          <p className="text-xs mt-1 opacity-90">
            {results.latency.mode} - {results.latency.optimization}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <p className="text-sm font-medium">Throughput</p>
          </div>
          <p className="text-3xl font-bold">
            {(results.throughput.value as number).toFixed(2)}
          </p>
          <p className="text-xs mt-1 opacity-90">
            {results.throughput.mode} - {results.throughput.optimization}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5" />
            <p className="text-sm font-medium">Memory</p>
          </div>
          <p className="text-3xl font-bold">
            {(results.memory.value as number).toFixed(2)}
          </p>
          <p className="text-xs mt-1 opacity-90">
            {results.memory.mode} - {results.memory.optimization}
          </p>
          <p className="text-xs mt-1 opacity-90">
            <small>
              {(results.memory.value as number) < 0
                ? 'Browser Memory released'
                : 'Additional Browser memory used'}
            </small>
          </p>
        </div>
      </div>
    </div>
  );
};
