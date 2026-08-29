'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  GachaResult,
  RATE_TOTAL,
  drawGacha,
  formatRate,
  parseDrawCount,
  parseRate,
  validateRates,
} from './gacha';

const numberFormatter = new Intl.NumberFormat('ja-JP');

function formatBigInt(value: bigint): string {
  return numberFormatter.format(value);
}

export default function Home() {
  const [countInput, setCountInput] = useState('1');
  const [star2Input, setStar2Input] = useState('18');
  const [star3Input, setStar3Input] = useState('3');
  const [result, setResult] = useState<GachaResult | null>(null);

  const validation = useMemo(() => {
    try {
      const count = parseDrawCount(countInput);
      const star2 = parseRate(star2Input);
      const star3 = parseRate(star3Input);
      validateRates(star2, star3);
      return {
        count,
        rates: { star2, star3 },
        star1: RATE_TOTAL - star2 - star3,
        error: '',
      };
    } catch (error) {
      return {
        count: null,
        rates: null,
        star1: null,
        error: error instanceof Error ? error.message : '入力内容を確認してください。',
      };
    }
  }, [countInput, star2Input, star3Input]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validation.count || !validation.rates) return;
    setResult(drawGacha(validation.count, validation.rates));
  }

  if (result) {
    return (
      <main className="site-shell">
        <div className="confetti confetti-one" aria-hidden="true" />
        <div className="confetti confetti-two" aria-hidden="true" />
        <section className="gacha-card result-card" aria-labelledby="result-title">
          <header className="card-header result-header">
            <p className="eyebrow">RESULT</p>
            <h1 id="result-title">集計結果</h1>
          </header>
          <div className="result-stack" aria-live="polite">
            <dl className="result-list">
              <div className="result-row result-three">
                <dt>☆☆☆</dt>
                <dd>{formatBigInt(result.star3)}<span>枚</span></dd>
              </div>
              <div className="result-row result-two">
                <dt>☆☆</dt>
                <dd>{formatBigInt(result.star2)}<span>枚</span></dd>
              </div>
              <div className="result-row result-one">
                <dt>☆</dt>
                <dd>{formatBigInt(result.star1)}<span>枚</span></dd>
              </div>
            </dl>
            <button className="back-button" type="button" onClick={() => setResult(null)}>設定に戻る</button>
          </div>
        </section>
      </main>
    );
  }

  const buttonCount = validation.count ? formatBigInt(validation.count) : 'n';

  return (
    <main className="site-shell">
      <div className="confetti confetti-one" aria-hidden="true" />
      <div className="confetti confetti-two" aria-hidden="true" />

      <section className="gacha-card" aria-labelledby="page-title">
        <header className="card-header">
          <p className="eyebrow">FINITE GACHA LAB.</p>
          <h1 id="page-title">有限ガチャ</h1>
          <p className="intro">任意回連が　できるよ</p>
        </header>

        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          <label className="field field-count">
            <span className="field-label">回す回数</span>
            <span className="input-wrap">
              <input
                value={countInput}
                onChange={(event) => setCountInput(event.target.value)}
                inputMode="numeric"
                autoComplete="off"
                aria-describedby="count-note form-error"
              />
              <span className="input-suffix">連</span>
            </span>
            <span className="field-note" id="count-note">1〜9,223,372,036,854,775,807</span>
          </label>

          <fieldset className="rate-group">
            <legend>排出率</legend>
            <div className="rate-grid">
              <label className="rate-card star-three">
                <span className="star-label">☆☆☆</span>
                <span className="input-wrap compact">
                  <input
                    value={star3Input}
                    onChange={(event) => setStar3Input(event.target.value)}
                    inputMode="decimal"
                    autoComplete="off"
                    aria-label="星3の排出率"
                    aria-describedby="form-error"
                  />
                  <span className="input-suffix">%</span>
                </span>
              </label>
              <label className="rate-card star-two">
                <span className="star-label">☆☆</span>
                <span className="input-wrap compact">
                  <input
                    value={star2Input}
                    onChange={(event) => setStar2Input(event.target.value)}
                    inputMode="decimal"
                    autoComplete="off"
                    aria-label="星2の排出率"
                    aria-describedby="form-error"
                  />
                  <span className="input-suffix">%</span>
                </span>
              </label>
              <div
                className="rate-card star-one"
                aria-label={`星1の排出率 ${validation.star1 === null ? '計算できません' : `${formatRate(validation.star1)}パーセント`}`}
              >
                <span className="star-label">☆</span>
                <strong>{validation.star1 === null ? '—' : `${formatRate(validation.star1)}%`}</strong>
                <span className="auto-label">のこり</span>
              </div>
            </div>
          </fieldset>

          <p className="form-error" id="form-error" role="alert">{validation.error}</p>
          <button className="draw-button" type="submit" disabled={Boolean(validation.error)}>
            {buttonCount}連ガチャを回す
          </button>
        </form>
      </section>

      <footer> </footer>
    </main>
  );
}
