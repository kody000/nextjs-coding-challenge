export function calculateWPM(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  const words = correctChars / 5;
  return Math.round(words / minutes);
}

export function calculateAccuracy(correctChars: number, totalChars: number): number {
  if (totalChars === 0) return 0;
  return Math.round((correctChars / totalChars) * 100) / 100;
}

export function compareText(input: string, target: string): { correctChars: number; totalChars: number } {
  let correctChars = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === target[i]) {
      correctChars++;
    }
  }
  return { correctChars, totalChars: input.length };
}
