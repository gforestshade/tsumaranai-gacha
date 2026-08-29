export const MAX_DRAWS = 9_223_372_036_854_775_807n;
export const EXACT_DRAW_LIMIT = 1_000_000n;
export const RATE_SCALE = 1_000_000n;
export const RATE_TOTAL = 100n * RATE_SCALE;

export type Rates = {
  star2: bigint;
  star3: bigint;
};

export type GachaResult = {
  star1: bigint;
  star2: bigint;
  star3: bigint;
};

export type RandomSource = () => number;

export function normalizeNumericText(value: string): string {
  return value.normalize('NFKC').replace(/[,_\s]/g, '');
}

export function parseDrawCount(value: string): bigint {
  const normalized = normalizeNumericText(value);
  if (!/^\d+$/.test(normalized)) {
    throw new Error('回数は整数で入力してください。');
  }

  const count = BigInt(normalized);
  if (count < 1n || count > MAX_DRAWS) {
    throw new Error('回数は1から9,223,372,036,854,775,807までです。');
  }
  return count;
}

export function parseRate(value: string): bigint {
  const normalized = value.normalize('NFKC').trim();
  const match = /^(\d+)(?:\.(\d{0,6}))?$/.exec(normalized);
  if (!match) {
    throw new Error('排出率は小数点以下6桁までの数値で入力してください。');
  }

  const fraction = (match[2] ?? '').padEnd(6, '0');
  const units = BigInt(match[1]) * RATE_SCALE + BigInt(fraction || '0');
  if (units > RATE_TOTAL) {
    throw new Error('排出率は0%から100%までです。');
  }
  return units;
}

export function validateRates(star2: bigint, star3: bigint): Rates {
  if (star2 < 0n || star3 < 0n || star2 + star3 > RATE_TOTAL) {
    throw new Error('☆2と☆3の合計は100%以下にしてください。');
  }
  return { star2, star3 };
}

export function formatRate(units: bigint): string {
  const whole = units / RATE_SCALE;
  const fraction = (units % RATE_SCALE).toString().padStart(6, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function poisson(lambda: number, random: RandomSource): bigint {
  const limit = Math.exp(-lambda);
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > limit);
  return BigInt(count - 1);
}

function standardNormal(random: RandomSource): number {
  const u1 = Math.max(random(), Number.EPSILON);
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function sampleBinomial(
  trials: bigint,
  successWeight: bigint,
  totalWeight: bigint,
  random: RandomSource = Math.random,
): bigint {
  if (trials <= 0n || successWeight <= 0n) return 0n;
  if (successWeight >= totalWeight) return trials;

  const probability = Number(successWeight) / Number(totalWeight);
  const trialsApprox = Number(trials);
  const mean = trialsApprox * probability;
  const failureMean = trialsApprox * (1 - probability);

  if (mean < 30) return poisson(mean, random);
  if (failureMean < 30) return trials - poisson(failureMean, random);

  const meanFloor = (trials * successWeight) / totalWeight;
  const meanRemainder = (trials * successWeight) % totalWeight;
  const fraction = Number(meanRemainder) / Number(totalWeight);
  const deviation = Math.sqrt(mean * (1 - probability)) * standardNormal(random);
  const roundedOffset = BigInt(Math.round(fraction + deviation));
  const sampled = meanFloor + roundedOffset;

  if (sampled < 0n) return 0n;
  if (sampled > trials) return trials;
  return sampled;
}

export function drawGacha(
  count: bigint,
  rates: Rates,
  random: RandomSource = Math.random,
): GachaResult {
  validateRates(rates.star2, rates.star3);

  if (count <= EXACT_DRAW_LIMIT) {
    const star3Boundary = Number(rates.star3) / Number(RATE_TOTAL);
    const star2Boundary = Number(rates.star3 + rates.star2) / Number(RATE_TOTAL);
    let star3 = 0n;
    let star2 = 0n;

    for (let index = 0; index < Number(count); index += 1) {
      const roll = random();
      if (roll < star3Boundary) star3 += 1n;
      else if (roll < star2Boundary) star2 += 1n;
    }

    return { star1: count - star2 - star3, star2, star3 };
  }

  const star3 = sampleBinomial(count, rates.star3, RATE_TOTAL, random);
  const remaining = count - star3;
  const remainingWeight = RATE_TOTAL - rates.star3;
  const star2 = sampleBinomial(remaining, rates.star2, remainingWeight, random);
  return { star1: remaining - star2, star2, star3 };
}
