export const splitDataAtZero = (labels, data) => {
  let positiveSegment = [];
  let negativeSegment = [];
  let splitLabels = [];
  let pointRadiusNegative = [];
  let pointRadiusPositive = [];

  for (let i = 0; i < data.length; i++) {
    const currentValue = data[i];
    const prevValue = i > 0 ? data[i - 1] : null;

    // Check if we are crossing zero
    if (currentValue !== null && prevValue !== null && currentValue * prevValue < 0) {
      const zeroCrossing = (prevValue / (prevValue - currentValue)) * (labels[i].getTime() - labels[i - 1].getTime()) + labels[i - 1].getTime();
      splitLabels.push(new Date(zeroCrossing));
      positiveSegment.push(0);
      negativeSegment.push(0);
      pointRadiusPositive.push(0); // No point at the intersection
      pointRadiusNegative.push(0); // No point at the intersection
    }

    splitLabels.push(labels[i]);

    if (currentValue !== null && currentValue >= 0) {
      positiveSegment.push(currentValue);
      negativeSegment.push(null);
      pointRadiusPositive.push(3); // Point for positive values
      pointRadiusNegative.push(0); // No point for negative values
    } else if (currentValue !== null && currentValue < 0) {
      positiveSegment.push(null);
      negativeSegment.push(currentValue);
      pointRadiusPositive.push(0); // No point for positive values
      pointRadiusNegative.push(3); // Point for negative values
    } else {
      positiveSegment.push(null);
      negativeSegment.push(null);
      pointRadiusPositive.push(0); // No point for null values
      pointRadiusNegative.push(0); // No point for null values
    }
  }

  return { labels: splitLabels, positive: positiveSegment, negative: negativeSegment, pointRadiusPositive, pointRadiusNegative };
};
