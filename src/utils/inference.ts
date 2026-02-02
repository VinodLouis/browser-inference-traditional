import * as ort from 'onnxruntime-web';
import { testDataGenerator } from './testDataGenerator';

export class InferenceEngine {
  private sessionCache: Record<string, ort.InferenceSession> = {};
  private nlpTokenizer: any = null;

  async loadModel(
    modelName: string,
    optimization: string = 'none',
  ): Promise<ort.InferenceSession | null> {
    const cacheKey = `${modelName}_${optimization}`;
    if (this.sessionCache[cacheKey]) {
      return this.sessionCache[cacheKey];
    }

    try {
      const modelUrls: Record<string, string> = {
        mobilenetv2: '/models/mobilenetv2_x1_0.onnx',
        resnet20: '/models/resnet20.onnx',
        distilbert: '/models/distilbert_ag_news.onnx',
      };

      const modelUrl = modelUrls[modelName];
      if (!modelUrl) {
        throw new Error(`Unknown model: ${modelName}`);
      }

      const sessionOptions: ort.InferenceSession.SessionOptions = {
        executionProviders: this.getExecutionProviders(optimization),
        graphOptimizationLevel: 'all',
      };

      const session = await ort.InferenceSession.create(
        modelUrl,
        sessionOptions,
      );
      this.sessionCache[cacheKey] = session;
      return session;
    } catch (error) {
      console.error(`Error loading model ${modelName}:`, error);
      return null;
    }
  }

  private getExecutionProviders(optimization: string): string[] {
    const providers: Record<string, string[]> = {
      none: ['cpu'],
      webgl: ['webgl', 'cpu'],
      webgpu: ['webgpu', 'cpu'],
      wasm_simd: ['wasm', 'cpu'],
      webnn: ['webnn', 'cpu'],
    };
    return providers[optimization] || providers['none'];
  }

  private getPredictions(tensor: ort.Tensor): number[] {
    const batchSize = tensor.dims[0] as number;
    const numClasses = tensor.dims[1] as number;
    const data = tensor.data as Float32Array;
    const predictions: number[] = [];

    for (let i = 0; i < batchSize; i++) {
      const start = i * numClasses;
      const end = start + numClasses;
      const logits = data.slice(start, end);
      const pred = logits.indexOf(Math.max(...logits));
      predictions.push(pred);
    }

    return predictions;
  }

  async runInference(session: ort.InferenceSession, input: any) {
    if (!session) {
      console.error('Session not loaded');
      return null;
    }

    try {
      const startTime = performance.now();
      const startMemory = performance.memory?.usedJSHeapSize ?? 0;

      const inputName = session.inputNames[0];
      const dataType = inputName.includes('input_ids') ? 'int64' : 'float32';
      let inputData = input.data || input.texts;

      if (dataType === 'int64') {
        inputData = this.ensureBigInt64Array(inputData);
      }

      const inputTensor = new ort.Tensor(dataType, inputData, input.shape);
      const feeds: Record<string, ort.Tensor> = {};
      feeds[inputName] = inputTensor;

      // Handle attention_mask if present
      const attentionMaskIndex = session.inputNames.indexOf('attention_mask');
      if (attentionMaskIndex !== -1 && input.attention_mask) {
        const maskName = session.inputNames[attentionMaskIndex];
        const attentionMaskData = this.ensureBigInt64Array(
          input.attention_mask,
        );
        const maskTensor = new ort.Tensor(
          'int64',
          attentionMaskData,
          input.shape,
        );
        feeds[maskName] = maskTensor;
      }

      // Handle token_type_ids if present
      const tokenTypeIdIndex = session.inputNames.indexOf('token_type_ids');
      if (tokenTypeIdIndex !== -1 && input.token_type_ids) {
        const tokenTypeIdName = session.inputNames[tokenTypeIdIndex];
        const tokenTypeIdData = this.ensureBigInt64Array(input.token_type_ids);
        const tokenTypeIdsTensor = new ort.Tensor(
          'int64',
          tokenTypeIdData,
          input.shape,
        );
        feeds[tokenTypeIdName] = tokenTypeIdsTensor;
      }

      const results = await session.run(feeds);

      const outputName = session.outputNames[0];
      const output = results[outputName];
      const predictions = this.getPredictions(output);
      const endTime = performance.now();
      const endMemory = performance.memory?.usedJSHeapSize ?? 0;

      return {
        latency: endTime - startTime,
        timestamp: Date.now(),
        memoryDelta: endMemory - startMemory,
        output,
        predictions,
        batchSize: input.shape[0],
      };
    } catch (error) {
      console.error('Inference error:', error);
      return null;
    }
  }

  private ensureBigInt64Array(data: any): BigInt64Array {
    if (!data) {
      return new BigInt64Array(0);
    }

    if (data instanceof BigInt64Array) {
      return data;
    }

    try {
      const arr = Array.isArray(data) ? data : Array.from(data);
      return new BigInt64Array(
        arr.map((x) => {
          const intValue = Number.isInteger(x) ? x : Math.floor(Number(x));
          return BigInt(intValue);
        }),
      );
    } catch (error) {
      console.error('Error in ensureBigInt64Array:', error);
      return new BigInt64Array(0);
    }
  }

  generateBalancedDataSet(
    modelName: string,
    numSamples: number = 10,
  ): string[] {
    if (modelName === 'distilbert') {
      return testDataGenerator.generateBalancedNLPDataSet(numSamples);
    } else {
      return testDataGenerator.generateBalancedVisionDataSet(numSamples);
    }
  }

  async initializeTokenizer() {
    if (this.nlpTokenizer) {
      return this.nlpTokenizer;
    }

    try {
      const { AutoTokenizer, env } =
        await import('https://cdn.jsdelivr.net/npm/@xenova/transformers');

      // Tell transformers.js to use local files
      env.allowLocalModels = true;
      env.localModelPath = '/models'; // served at http://localhost:8080/models

      console.log('Loading AG News tokenizer from local /models ...');

      // Folder that contains tokenizer.json and tokenizer_config.json
      this.nlpTokenizer = await AutoTokenizer.from_pretrained(
        'local-tokenizer-agnews', // just an id; real path comes from env.localModelPath
        {
          // Map this id to your local folder
          revision: undefined,
          // transformers.js will look for:
          //   /models/local-tokenizer-agnews/tokenizer.json
          //   /models/local-tokenizer-agnews/tokenizer_config.json
        },
      );

      console.log('✅ BERT Tokenizer initialized from local files');
      return this.nlpTokenizer;
    } catch (error) {
      console.error('❌ Failed to initialize local tokenizer:', error);
      throw error;
    }
  }

  async tokenizeCorpus(corpus: any, maxLength = 128) {
    // Initialize tokenizer if needed
    const tokenizer = await this.initializeTokenizer();

    const tokenIds = [];
    const attentionMasks = [];

    for (let sample of corpus) {
      // Combine Title and Description
      const fullText = `${sample.Title} ${sample.Description}`.trim();

      // CRITICAL: Use PROPER BERT tokenization with AG News model
      // This matches server tokenization exactly
      const encoded = tokenizer.encode(fullText);

      let inputIds = encoded;
      let attentionMask = encoded.map(() => 1);

      // Truncate if too long
      if (inputIds.length > maxLength) {
        inputIds = inputIds.slice(0, maxLength);
        attentionMask = attentionMask.slice(0, maxLength);
      }

      // Pad if too short
      const padLength = maxLength - inputIds.length;
      if (padLength > 0) {
        inputIds = [...inputIds, ...Array(padLength).fill(0)];
        attentionMask = [...attentionMask, ...Array(padLength).fill(0)];
      }

      tokenIds.push(inputIds);
      attentionMasks.push(attentionMask);
    }

    // CRITICAL: Flatten into BigInt64Array for ONNX int64 tensors
    const batchSize = tokenIds.length;
    const totalTokens = batchSize * maxLength;

    // Input IDs
    const inputIdsFlat = new BigInt64Array(totalTokens);
    for (let i = 0; i < batchSize; i++) {
      for (let j = 0; j < maxLength; j++) {
        inputIdsFlat[i * maxLength + j] = BigInt(tokenIds[i][j]);
      }
    }

    // Attention masks
    const attentionMaskFlat = new BigInt64Array(totalTokens);
    for (let i = 0; i < batchSize; i++) {
      for (let j = 0; j < maxLength; j++) {
        attentionMaskFlat[i * maxLength + j] = BigInt(attentionMasks[i][j]);
      }
    }

    // Token type IDs (all 0s for single-sequence classification)
    const tokenTypeIdsFlat = new BigInt64Array(totalTokens);
    tokenTypeIdsFlat.fill(0n);

    return {
      texts: inputIdsFlat,
      attention_mask: attentionMaskFlat,
      token_type_ids: tokenTypeIdsFlat,
    };
  }

  async generateTestInput(modelName: string, sampleList: string[]) {
    try {
      const input = await testDataGenerator.generateTestInput(
        modelName,
        sampleList,
      );

      // If this is NLP input with corpus, tokenize it
      if (input.type === 'nlp' && input.corpus) {
        const maxLength = input.shape[1];
        const tokenized = await this.tokenizeCorpus(input.corpus, maxLength);

        // Spread tokenized tensors into input
        (input as any).texts = tokenized.texts;
        (input as any).attention_mask = tokenized.attention_mask;
        (input as any).token_type_ids = tokenized.token_type_ids;

        delete (input as any).corpus; // Remove corpus, keep texts
      }
      return input;
    } catch (error: any) {
      console.warn('Real data unavailable, using random:', error.message);
      return this.generateRandomTestInput(modelName);
    }
    //return ;
  }

  /**
   * Generate random test input (fallback)
   */
  generateRandomTestInput(modelName: string) {
    if (modelName === 'distilbert') {
      return {
        type: 'nlp',
        data: new Float32Array(512).fill(0).map(() => Math.random() * 1000),
        shape: [1, 512],
        attention_mask: new Float32Array(512).fill(1),
      };
    } else {
      return {
        type: 'vision',
        data: new Float32Array(3 * 32 * 32).fill(0).map(() => Math.random()),
        shape: [1, 3, 32, 32],
        labels: [0],
      };
    }
  }

  async warmupModel(
    session: ort.InferenceSession,
    modelName: string,
    iterations: number = 3,
  ) {
    for (let i = 0; i < iterations; i++) {
      const input = await this.generateTestInput(
        modelName,
        modelName == 'distilbert' ? ['0_0'] : ['0_0.jpg'],
      );
      await this.runInference(session, input);
    }
  }

  clearCache() {
    testDataGenerator.clearCache();
  }

  getMemoryUsage(): number {
    if ((performance as any).memory) {
      return parseFloat(
        ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(2),
      );
    }
    return 145; // Fallback
  }
}

export const inferenceEngine = new InferenceEngine();
