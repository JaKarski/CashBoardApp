export const splitDataAtZero = (labels, data) => {
  let positiveSegment = [];
  let negativeSegment = [];
  let splitLabels = [];
  let pointRadiusNegative = [];
  let pointRadiusPositive = [];

  for (let i = 0; i < data.length; i++) {
    const currentValue = data[i];
    const prevValue = i > 0 ? data[i - 1] : null;

    // Sprawdzamy, czy przekraczamy zero
    if (currentValue !== null && prevValue !== null && currentValue * prevValue < 0) {
      const zeroCrossing = (prevValue / (prevValue - currentValue)) * (labels[i].getTime() - labels[i - 1].getTime()) + labels[i - 1].getTime();
      splitLabels.push(new Date(zeroCrossing));
      positiveSegment.push(0);
      negativeSegment.push(0);
      pointRadiusPositive.push(0); // Brak punktu na przecięciu
      pointRadiusNegative.push(0); // Brak punktu na przecięciu
    }

    splitLabels.push(labels[i]);

    if (currentValue !== null && currentValue >= 0) {
      positiveSegment.push(currentValue);
      negativeSegment.push(null);
      pointRadiusPositive.push(3); // Punkt dla dodatnich wartości
      pointRadiusNegative.push(0); // Brak punktu dla ujemnych wartości
    } else if (currentValue !== null && currentValue < 0) {
      positiveSegment.push(null);
      negativeSegment.push(currentValue);
      pointRadiusPositive.push(0); // Brak punktu dla dodatnich wartości
      pointRadiusNegative.push(3); // Punkt dla ujemnych wartości
    } else {
      positiveSegment.push(null);
      negativeSegment.push(null);
      pointRadiusPositive.push(0); // Brak punktu dla null
      pointRadiusNegative.push(0); // Brak punktu dla null
    }
  }

  return { labels: splitLabels, positive: positiveSegment, negative: negativeSegment, pointRadiusPositive, pointRadiusNegative };
};
