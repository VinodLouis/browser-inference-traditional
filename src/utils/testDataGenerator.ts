export class TestDataGenerator {
  private dataPath: string = '/data';
  private mean: number[] = [0.4914, 0.4822, 0.4465];
  private std: number[] = [0.247, 0.2435, 0.2616];
  private imageCache: Map<string, Float32Array> = new Map();
  private textCache: any[] = [];

  async loadCIFAR10Image(imagePath: string): Promise<Float32Array> {
    if (this.imageCache.has(imagePath)) {
      return this.imageCache.get(imagePath)!;
    }

    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      const img = new Image();
      img.src = URL.createObjectURL(blob);

      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Failed to get canvas context');

            ctx.drawImage(img, 0, 0, 32, 32);
            const imageData = ctx.getImageData(0, 0, 32, 32);
            const data = imageData.data;
            const tensor = new Float32Array(3 * 32 * 32);

            for (let i = 0; i < 32 * 32; i++) {
              for (let c = 0; c < 3; c++) {
                const pixelValue = data[i * 4 + c];
                const normalizedValue =
                  (pixelValue / 255.0 - this.mean[c]) / this.std[c];
                tensor[c * 32 * 32 + i] = normalizedValue;
              }
            }

            this.imageCache.set(imagePath, tensor);
            URL.revokeObjectURL(img.src);
            resolve(tensor);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () =>
          reject(new Error(`Failed to load image: ${imagePath}`));
      });
    } catch (error) {
      console.error(`Error loading image ${imagePath}:`, error);
      throw error;
    }
  }

  generateBalancedNLPDataSet(numSamples: number = 10): string[] {
    const totalClasses = 4;
    const samplesPerClass = Math.ceil(numSamples / totalClasses);
    const selectedSamples: string[] = [];

    for (let classIdx = 0; classIdx < totalClasses; classIdx++) {
      for (let indexIdx = 0; indexIdx < samplesPerClass; indexIdx++) {
        selectedSamples.push(`${classIdx}_${indexIdx}`);
      }
    }

    return selectedSamples;
  }

  generateBalancedVisionDataSet(numSamples: number = 10): string[] {
    const imageFiles: string[] = [];
    const totalClass = 10;
    const filesPerClass = Math.ceil(numSamples / totalClass);

    for (let classIdx = 0; classIdx < totalClass; classIdx++) {
      for (let fileIdx = 0; fileIdx < filesPerClass; fileIdx++) {
        imageFiles.push(`${classIdx}_${fileIdx}.jpg`);
      }
    }

    return imageFiles.slice(0, numSamples);
  }

  async generateVisionDataset(imageFiles: string[] = ['0_0.jpg']) {
    if (imageFiles.length === 0) {
      throw new Error('No image files found');
    }

    const allTensors: Float32Array[] = [];
    const labels: number[] = [];

    for (const file of imageFiles) {
      const imagePath = `${this.dataPath}/cifar10/data/${file}`;
      const label = parseInt(file.split('_')[0]);
      try {
        const tensor = await this.loadCIFAR10Image(imagePath);
        allTensors.push(tensor);
        labels.push(label);
      } catch (error) {
        console.warn(`Failed to load ${file}, skipping`);
      }
    }

    if (allTensors.length === 0) {
      throw new Error('Failed to load any images');
    }

    const batchSize = allTensors.length;
    const stackedData = new Float32Array(batchSize * 3 * 32 * 32);

    for (let i = 0; i < batchSize; i++) {
      stackedData.set(allTensors[i], i * 3 * 32 * 32);
    }

    return {
      data: stackedData,
      shape: [batchSize, 3, 32, 32],
      labels,
      batchSize,
    };
  }

  async generateNLPDataset(sampleList: string[] = ['0_0']) {
    if (this.textCache.length === 0) {
      const response = await fetch(`${this.dataPath}/agnews/test.json`);
      this.textCache = await response.json();
    }

    const corpus: any[] = [];
    const labels: number[] = [];
    const ids: string[] = [];

    sampleList.forEach((sample) => {
      const item = this.textCache.find((entry: any) => entry.id === sample);
      if (item) {
        corpus.push(item);
        labels.push(item['Class Index']);
        ids.push(item.id);
      }
    });

    if (corpus.length === 0) {
      throw new Error('No valid JSON entries found');
    }

    return {
      corpus,
      labels,
      ids,
      batchSize: corpus.length,
    };
  }

  async generateTestInput(modelName: string, sampleList: string[]) {
    if (modelName === 'distilbert') {
      const dataset = await this.generateNLPDataset(sampleList);
      return {
        type: 'nlp',
        corpus: dataset.corpus,
        labels: dataset.labels,
        shape: [dataset.corpus.length, 128],
      };
    } else {
      const dataset = await this.generateVisionDataset(sampleList);
      return {
        type: 'vision',
        data: dataset.data,
        shape: dataset.shape,
        labels: dataset.labels,
      };
    }
  }

  clearCache() {
    this.imageCache.clear();
    this.textCache = [];
  }
}

export const testDataGenerator = new TestDataGenerator();
