export function purityToFraction(purity: string): number {
  // Gold: 24K=1, 22K=22/24, 18K=18/24, 14K=14/24
  // Silver: 925=0.925, 999=0.999
  const map: Record<string, number> = {
    "24K": 1,
    "22K": 22 / 24,
    "18K": 18 / 24,
    "14K": 14 / 24,
    "999": 0.999,
    "925": 0.925,
  };
  return map[purity] ?? 1;
}
