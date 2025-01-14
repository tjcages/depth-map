export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const interpolateColor = (
  color1: number[],
  color2: number[],
  factor: number = 0.5
): number[] => {
  const result = color1.slice();
  for (let i = 0; i < 3; i++) {
    const delta = color2[i] - color1[i];
    const newColorComponent = color1[i] + factor * delta;
    result[i] = Math.max(0, Math.min(Math.round(newColorComponent), 255));
  }
  return result;
};

export const interpolateColors = (
  color1: number[],
  color2: number[],
  steps: number
): number[][] => {
  const stepFactor = 1 / (steps - 1);
  const interpolatedColorArray: number[][] = [];

  for (let i = 0; i < steps; i++) {
    interpolatedColorArray.push(interpolateColor(color1, color2, stepFactor * i));
  }

  return interpolatedColorArray;
};
