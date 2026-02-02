import { inferenceEngine } from './inference';
import { InferenceMeasurement, Metrics } from '../types/benchmark';
import { computeMetrics } from './metrics';
import {
  NetworkLatencyMode,
  NETWORK_LATENCY_CONFIGS,
  simulateNetworkLatency,
} from '../types/network';
import { testDataGenerator } from './testDataGenerator';
import { calculateMetrics } from './metricsCalculator';

export class BrowserBenchmark {
  async benchmark(
    modelName: string,
    numSamples: number = 50,
    optimization: string = 'none',
    cb: (completed: number) => void = () => {},
  ): Promise<Metrics> {
    console.log(`Starting browser benchmark: ${modelName} (${optimization})`);

    try {
      // Load model
      const session = await inferenceEngine.loadModel(modelName, optimization);
      if (!session) {
        throw new Error('Failed to load model');
      }

      const clientMeasurements: InferenceMeasurement[] = [];

      const batchSize = 1;
      const numBatches = Math.ceil(numSamples / batchSize);
      const filePaths = inferenceEngine.generateBalancedDataSet(
        modelName,
        numSamples,
      );

      const allPredictions: Array<{ actual: number; predicted: number }> = [];
      let completed = 0;
      for (let i = 0; i < numBatches; i++) {
        const start = i * batchSize;
        const batchFiles = filePaths.slice(start, start + batchSize);
        const batchInput = await inferenceEngine.generateTestInput(
          modelName,
          batchFiles,
        );
        const result = await inferenceEngine.runInference(session, batchInput);
        if (result) {
          clientMeasurements.push(result);
        }
        completed++;
        cb(completed);

        if (result) {
          batchFiles.forEach((eachFile, index) => {
            allPredictions.push({
              actual: parseInt(eachFile.split('_')[0]),
              predicted: result.predictions[index],
            });
          });
        }
      }

      // Get statistics
      // const stats = inferenceEngine.getInferenceStats();
      // if (!stats) {
      //   throw new Error('No inference statistics');
      // }

      // // Calculate throughput
      // const totalInferenceTimeMs = inferenceTimes.reduce((a, b) => a + b, 0);
      // const throughput = numSamples / (totalInferenceTimeMs / 1000);

      // // Dynamic metrics
      // const memoryMetrics = await measureMemoryDelta(initialMemory);
      // const frameMetrics = await measureFrameMetrics(500);
      // const responsivenessScore = 95; // Placeholder for browser

      // Accuracy metrics
      const numClasses = modelName === 'distilbert' ? 4 : 10;
      const accuracyMetrics = computeMetrics(
        allPredictions.map((p) => p.actual),
        allPredictions.map((p) => p.predicted),
        numClasses,
      );

      return calculateMetrics(clientMeasurements, 'Browser', accuracyMetrics);
    } catch (error) {
      console.error('Benchmark error:', error);
      throw error;
    }
  }
}

export class ServerBenchmark {
  private serverUrl: string = 'http://localhost:8000';
  private networkRTT: NetworkLatencyMode = 'wifi';

  setNetworkRTT(rtt: NetworkLatencyMode) {
    this.networkRTT = rtt;
  }

  async benchmark(
    modelName: string,
    numSamples: number = 50,
    optimization: string = 'none',
    cb: (completed: number) => void = () => {},
  ): Promise<Metrics> {
    console.log(
      `Starting server benchmark: ${modelName} (${optimization}) with RTT: ${this.networkRTT}`,
    );

    const rttValue = NETWORK_LATENCY_CONFIGS[this.networkRTT].latency;

    try {
      const serverMeasurements: InferenceMeasurement[] = [];

      const filePaths = inferenceEngine.generateBalancedDataSet(
        modelName,
        numSamples,
      );

      let resolvedInputs: any = null;
      if (modelName === 'distilbert') {
        resolvedInputs = await testDataGenerator.generateTestInput(
          modelName,
          filePaths,
        );
      }

      const allPredictions: Array<{ actual: number; predicted: number }> = [];
      let completed = 0;
      for (let i = 0; i < numSamples; i++) {
        if (modelName !== 'distilbert') {
          // Fetch the image from public/data
          const res = await fetch(`/data/cifar10/data/${filePaths[i]}`);
          const blob = await res.blob();

          // Wrap blob in a File (optional, but makes it look like a real upload)
          const imageFile = new File([blob], filePaths[i], { type: blob.type });

          // Build FormData
          const formData = new FormData();
          formData.append('file', imageFile);
          formData.append('model', modelName);
          formData.append('device', optimization);

          const startTime = performance.now();
          const startMemory = performance.memory?.usedJSHeapSize ?? 0;

          await simulateNetworkLatency(rttValue);

          // Send to FastAPI
          const response = await fetch(`${this.serverUrl}/api/benchmark`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
          }

          const result = await response.json();

          await simulateNetworkLatency(rttValue);

          const endTime = performance.now();
          const endMemory = performance.memory?.usedJSHeapSize ?? 0;

          if (result) {
            serverMeasurements.push(
              Object.assign({}, result, {
                latency: endTime - startTime,
                timestamp: Date.now(),
                memoryDelta: endMemory - startMemory,
              }),
            );
            allPredictions.push({
              actual: parseInt(filePaths[i].split('_')[0]),
              predicted: result.predictions,
            });
          }
          completed++;
          cb(completed);
        } else {
          // For NLP model benchmarking
          const formData = new FormData();
          formData.append(
            'text',
            `${resolvedInputs.corpus[i].Text} ${resolvedInputs.corpus[i].Description}`,
          );
          formData.append('model', modelName);
          formData.append('device', optimization);

          const startTime = performance.now();
          const startMemory = performance.memory?.usedJSHeapSize ?? 0;

          await simulateNetworkLatency(rttValue);

          const response = await fetch(`${this.serverUrl}/api/benchmark`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
          }

          const result = await response.json();

          await simulateNetworkLatency(rttValue);

          const endTime = performance.now();
          const endMemory = performance.memory?.usedJSHeapSize ?? 0;
          if (result) {
            serverMeasurements.push(
              Object.assign({}, result, {
                latency: endTime - startTime,
                timestamp: Date.now(),
                memoryDelta: endMemory - startMemory,
              }),
            );
            allPredictions.push({
              actual: parseInt(filePaths[i].split('_')[0]),
              predicted: result.predictions,
            });
          }
          completed++;
          cb(completed);
        }
      }

      const numClasses = modelName === 'distilbert' ? 4 : 10;
      const accuracyMetrics = computeMetrics(
        allPredictions.map((p) => p.actual),
        allPredictions.map((p) => p.predicted),
        numClasses,
      );

      return calculateMetrics(serverMeasurements, 'Server', accuracyMetrics);
    } catch (error) {
      console.error('Benchmark error:', error);
      throw error;
    }
  }
}

export const browserBenchmark = new BrowserBenchmark();
export const serverBenchmark = new ServerBenchmark();
