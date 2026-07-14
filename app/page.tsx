"use client";

import { useEffect, useState } from "react";

type Board = { rank:number; alias:string; broker_code:string; style:string; health:string; recent_win_rate_pct:number; recent_avg_roi_pct:number; lifetime_trades:number; last_action:string };
type Inventory = { alias:string; broker_code:string; stock_code:string; stock_name:string; build_amount:string; estimated_cost:number; latest_price:number; roi_pct:number; status:string };
type Data = { updated_at:string|null; as_of:string; notice:string; metrics:{active:number;short_completed:number;swing_over_100:number;active_candidates:number}; leaderboard:Board[]; inventory:Inventory[]; recent_flow:{side:string;alias:string;broker_code:string;detail:string;stock:string;date:string}[] };
const empty: Data = { updated_at:null, as_of:"—", notice:"資料尚未匯入。", metrics:{active:0,short_completed:0,swing_over_100:0,active_candidates:0}, leaderboard:[], inventory:[], recent_flow:[] };
const fmt = (value:number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

export default function Home() {
  const [filter, setFilter] = useState("全部");
  const [data, setData] = useState<Data>(empty);
  useEffect(() => { fetch("/data/dashboard.json", { cache:"no-store" }).then(r => r.ok ? r.json() : empty).then(setData).catch(() => setData(empty)); }, []);
  const shown = data.leaderboard.filter((r) => filter === "全部" || r.style === filter || r.health === filter);
  return <main>
    <header><b><i />RACE</b><span>興櫃主力戰情室</span><small>截至 {data.as_of}　•　研究觀察用</small></header>
    <section className="hero"><p>WHALE INTELLIGENCE / TPEX EMERGING</p><h1>追蹤還在場上的<br/><em>主力分點。</em></h1><div>不是只看歷史冠軍。近期勝率、報酬與出貨行為惡化者，會自動降級。</div><aside><strong>{data.metrics.active}</strong><span>暫定活躍主力</span><strong>{data.metrics.short_completed}</strong><span>短線完整戰役</span><strong>{data.metrics.swing_over_100}</strong><span>100% 波段戰役</span><strong>{data.metrics.active_candidates}</strong><span>當前未出清候選</span></aside></section>
    <section className="bar"><h2>主力排行榜</h2><nav>{["全部","短線","波段","active","watch","retired_or_degraded"].map(x=><button onClick={()=>setFilter(x)} className={filter===x?"on":""} key={x}>{({"全部":"全部","短線":"短線","波段":"波段","active":"活躍","watch":"觀察","retired_or_degraded":"退役"} as Record<string,string>)[x]}</button>)}</nav></section>
    <section className="board"><div className="head"><span>主力代號 / 分點</span><span>風格</span><span>健康度</span><span>近90日勝率</span><span>近90日平均ROI</span><span>近期動作</span></div>{shown.map((r)=><article key={r.broker_code}><mark>{String(r.rank).padStart(2,"0")}</mark><div><b>{r.alias}</b><small>分點 {r.broker_code}　•　歷史戰役 {r.lifetime_trades}</small></div><label>{r.style}</label><label className={r.health}>{r.health === "active" ? "活躍" : r.health === "retired_or_degraded" ? "退役" : "觀察"}</label><strong>{r.recent_win_rate_pct.toFixed(1)}%</strong><strong className={r.recent_avg_roi_pct >= 0 ? "gain" : "loss"}>{fmt(r.recent_avg_roi_pct)}</strong><div>{r.last_action}</div></article>)}{shown.length===0 && <p className="empty">目前沒有符合此篩選的分點。</p>}</section>
    <section className="bottom"><div className="card"><p>TOP 10 INVENTORY</p><h2>主力庫存與成本</h2><table><thead><tr><th>主力 / 個股</th><th>淨建倉</th><th>推估成本</th><th>出場價</th><th>報酬</th><th>狀態</th></tr></thead><tbody>{data.inventory.map(x=><tr key={`${x.broker_code}-${x.stock_code}`}><td>{x.alias} / {x.stock_code} {x.stock_name}</td><td>{x.build_amount}</td><td>{x.estimated_cost.toFixed(2)}</td><td>{x.latest_price.toFixed(2)}</td><td className={x.roi_pct >= 0 ? "gain" : "loss"}>{fmt(x.roi_pct)}</td><td>{x.status}</td></tr>)}</tbody></table></div><aside className="card flow"><p>RECENT FLOW</p><h2>近期大額進出</h2>{data.recent_flow.map(x=><div key={`${x.broker_code}-${x.stock}-${x.date}`}><b>{x.side}</b><span><strong>{x.alias}</strong>　{x.detail}<br/><small>{x.stock} • {x.date}</small></span></div>)}<footer>{data.notice}<br/><br/>「限價」將以成本、價格結構與庫存變化推估壓力／防守區；不是可見的真實委託價格。</footer></aside></section>
  </main>;
}
