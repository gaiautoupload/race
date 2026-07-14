"use client";

import { useEffect, useState } from "react";

type Player = { rank:number; alias:string; broker_code:string; health:string; recent_win_rate_pct:number; recent_avg_roi_pct:number; lifetime_trades:number; last_action:string };
type Data = { as_of:string; notice:string; leaderboard:Player[] };
const empty: Data = { as_of:"—", notice:"資料尚未匯入。", leaderboard:[] };
const status = (value:string) => value === "active" ? "仍在場上" : value === "retired_or_degraded" ? "已降級" : "觀察中";

export default function Home() {
  const [data, setData] = useState<Data>(empty);
  useEffect(() => { fetch("/data/dashboard.json", {cache:"no-store"}).then(r => r.json()).then(setData).catch(() => setData(empty)); }, []);
  const podium = data.leaderboard.slice(0, 5);
  return <main className="race">
    <header><a href="/" className="brand"><i />RACE</a><span>興櫃主力競技場</span><small>資料日：{data.as_of}</small></header>
    <section className="arena"><p>SEASON 01 · TPEX EMERGING</p><h1>誰還在<br/><em>贏。</em></h1><div>不是追逐歷史冠軍。選手必須持續通過近期勝率、報酬與出貨行為檢驗，才能留在榜上。</div></section>
    <section className="season"><span>排行榜僅顯示前五名</span><b>點選選手，查看今日攻防與持股推估 →</b></section>
    <section className="podium">{podium.map((p, index) => <a href={`/player?code=${p.broker_code}`} className={`fighter place-${index + 1}`} key={p.broker_code}>
      <mark>#{String(p.rank).padStart(2,"0")}</mark><div className="helmet">{p.alias.slice(-2)}</div><p>{index === 0 ? "LEAGUE LEADER" : "CHALLENGER"}</p><h2>{p.alias}</h2><small>分點 {p.broker_code}　·　{status(p.health)}</small><dl><div><dt>近90日勝率</dt><dd>{p.recent_win_rate_pct.toFixed(1)}%</dd></div><div><dt>近90日 ROI</dt><dd className={p.recent_avg_roi_pct >= 0 ? "gain" : "loss"}>{p.recent_avg_roi_pct >= 0 ? "+" : ""}{p.recent_avg_roi_pct.toFixed(1)}%</dd></div></dl><footer>{p.last_action}<b>進入選手頁 →</b></footer>
    </a>)}{podium.length === 0 && <p className="loading">正在載入競技場資料…</p>}</section>
    <footer className="notice">{data.notice}</footer>
  </main>;
}
