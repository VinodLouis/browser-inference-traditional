export type NetworkLatencyMode = 'none' | 'lan' | 'wifi' | '5g' | '4g';

export interface NetworkLatencyConfig {
  mode: NetworkLatencyMode;
  label: string;
  latency: number; // in milliseconds
  description: string;
}

// Network latency configurations based on real-world scenarios
export const NETWORK_LATENCY_CONFIGS: Record<
  NetworkLatencyMode,
  NetworkLatencyConfig
> = {
  none: {
    mode: 'none',
    label: 'Localhost (No Delay)',
    latency: 0,
    description: 'Direct connection - server on same machine',
  },
  lan: {
    mode: 'lan',
    label: 'Lab LAN',
    latency: 2.5,
    description: 'Local Area Network - server in same building',
  },
  wifi: {
    mode: 'wifi',
    label: 'Home WiFi',
    latency: 15,
    description: 'Home WiFi - typical residential connection',
  },
  '5g': {
    mode: '5g',
    label: '5G Mobile',
    latency: 30,
    description: '5G cellular network',
  },
  '4g': {
    mode: '4g',
    label: '4G Mobile',
    latency: 60,
    description: '4G/LTE cellular network',
  },
};

export const simulateNetworkLatency = async (
  latencyMs: number,
): Promise<void> => {
  if (latencyMs <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, latencyMs));
};
