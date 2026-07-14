"use client";

import { useEffect, useState } from "react";

type Player = { rank:number; alias:string; health:string; recent_win_rate_pct:number; recent_avg_roi_pct:number; lifetime_trades:number };
type Data = { as_of:string; notice:string; health_counts?:{active:number;watch:number;retired_or_degraded:number}; leaderboard:Player[] };
const empty: Data = { as_of:"—", notice:"資料尚未匯入。", leaderboard:[] };
const status = (value:string) => value === "active" ? "仍在場上" : value === "retired_or_degraded" ? "已降級" : "觀察中";

export default function Home() {
  const [data, setData] = useState<Data>(empty);
  useEffect(() => { fetch("/data/dashboard.json", {cache:"no-store"}).then(r => r.json()).then(setData).catch(() => setData(empty)); }, []);
  const podium = data.leaderboard.slice(0, 5);
  return <main className="race">
    <header><a href="/" className="brand"><i />RACE</a><span>興櫃主力競技場</span><small>資料日：{data.as_of}</small></header>
    <section className="arena"><p>SEASON 01 · TPEX EMERGING</p><h1>誰還在<br/><em>贏。</em></h1><div>不是追逐歷史冠軍。選手必須持續通過近期勝率、報酬與出貨行為檢驗，才能留在榜上。</div></section>
    <section className="season"><span>排行榜僅顯示前五名</span><b>僅提供匿名化歷史健康度彙整</b></section>
    <section className="podium">{podium.map((p, index) => <article className={`fighter place-${index + 1}`} key={p.alias}>
      <mark>#{String(p.rank).padStart(2,"0")}</mark><div className="helmet">{p.alias.slice(-2)}</div><p>{index === 0 ? "LEAGUE LEADER" : "CHALLENGER"}</p><h2>{p.alias}</h2><small>匿名健康度　·　{status(p.health)}</small><dl><div><dt>近90日勝率</dt><dd>{p.recent_win_rate_pct.toFixed(1)}%</dd></div><div><dt>近90日 ROI</dt><dd className={p.recent_avg_roi_pct >= 0 ? "gain" : "loss"}>{p.recent_avg_roi_pct >= 0 ? "+" : ""}{p.recent_avg_roi_pct.toFixed(1)}%</dd></div></dl><footer>完整歷史樣本：{p.lifetime_trades} 筆</footer>
    </article>)}{podium.length === 0 && <p className="loading">正在載入競技場資料…</p>}</section>
    <footer className="notice">{data.notice}</footer>
  </main>;
}
