export function computeMetrics(
  labels: number[],
  predictions: number[],
  numClasses: number,
) {
  const cm = Array(numClasses)
    .fill(0)
    .map(() => Array(numClasses).fill(0));

  // Confusion matrix
  for (let i = 0; i < labels.length; i++) {
    cm[labels[i]][predictions[i]]++;
  }

  console.log('Confusion Matrix:', cm);

  // Precision, recall, F1 score
  const precision: number[] = [];
  const recall: number[] = [];
  const f1Score: number[] = [];

  for (let i = 0; i < numClasses; i++) {
    const tp = cm[i][i];
    const fp = cm.reduce((sum, row) => sum + row[i], 0) - tp;
    const fn = cm[i].reduce((sum, val) => sum + val, 0) - tp;
    const tn =
      cm.reduce(
        (sum, row) => sum + row.reduce((rSum, val) => rSum + val, 0),
        0,
      ) -
      tp -
      fp -
      fn;

    precision[i] = tp / (tp + fp) || 0;
    recall[i] = tp / (tp + fn) || 0;
    f1Score[i] =
      (2 * precision[i] * recall[i]) / (precision[i] + recall[i]) || 0;
  }

  // Micro average
  const microPrecision = precision.reduce((a, b) => a + b, 0) / numClasses;
  const microRecall = recall.reduce((a, b) => a + b, 0) / numClasses;
  const microF1Score = f1Score.reduce((a, b) => a + b, 0) / numClasses;

  // ROC-AUC (simplified for multi-class)
  const rocAuc = computeRocAuc(cm);

  return {
    precision: microPrecision,
    recall: microRecall,
    f1Score: microF1Score,
    rocAuc: rocAuc,
  };
}

export function computeRocAuc(cm: number[][]): number {
  let totalAuc = 0;
  const numClasses = cm.length;
  const totalSamples = cm.reduce(
    (sum, row) => sum + row.reduce((rSum, val) => rSum + val, 0),
    0,
  );

  for (let i = 0; i < numClasses; i++) {
    const tp = cm[i][i];
    const fp = cm.reduce((sum, row) => sum + row[i], 0) - tp;
    const fn = cm[i].reduce((sum, val) => sum + val, 0) - tp;
    const tn = totalSamples - tp - fp - fn;

    // ROC-AUC for this class (one-vs-rest)
    const auc =
      (tp * tn - fp * fn) /
      Math.sqrt((tp + fn) * (fp + tn) * (tp + fp) * (fn + tn));

    totalAuc += auc;
  }

  return totalAuc / numClasses;
}
