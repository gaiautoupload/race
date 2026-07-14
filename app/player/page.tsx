"use client";

import { useEffect, useState } from "react";

type Flow = {stock_code:string; stock_name:string; amount_label:string; lots:number};
type Holding = {stock_code:string; stock_name:string; lots:number; estimated_cost:number; latest_price:number; roi_pct:number};
type Detail = {alias:string; broker_code:string; as_of:string; today:{buys:Flow[];sells:Flow[]}; five_days:{buys:Flow[];sells:Flow[]}; holdings:Holding[]; copy_plan:{entry:string;sizing:string;exit:string;guardrail:string}};
type Data = {notice:string;players:Record<string, Detail>};
const money = (value:number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

function FlowTable({title, rows, side}:{title:string;rows:Flow[];side:"buy"|"sell"}) { return <section className="flow-card"><p>{side === "buy" ? "ATTACK" : "DEFENSE"}</p><h3>{title}</h3><table><thead><tr><th>個股</th><th>金額</th><th>張數</th></tr></thead><tbody>{rows.map(x=><tr key={x.stock_code}><td>{x.stock_code} {x.stock_name}</td><td>{x.amount_label}</td><td>{x.lots.toLocaleString()} 張</td></tr>)}{rows.length===0&&<tr><td colSpan={3}>此資料日無可觀測成交。</td></tr>}</tbody></table></section> }

export default function PlayerPage() {
  const [data, setData] = useState<Data|null>(null);
  const [code, setCode] = useState("");
  useEffect(() => { const c=new URLSearchParams(window.location.search).get("code")||""; setCode(c); fetch("/data/dashboard.json", {cache:"no-store"}).then(r=>r.json()).then(setData).catch(()=>setData({notice:"資料讀取失敗。",players:{}})); }, []);
  const player = data?.players[code];
  if (!player) return <main className="race player"><header><a href="/" className="brand"><i />RACE</a></header><p className="loading">找不到選手資料，請由排行榜重新選擇。</p></main>;
  return <main className="race player"><header><a href="/" className="brand"><i />RACE</a><span>選手資料室</span><small>資料日：{player.as_of}</small></header>
    <section className="player-hero"><a href="/">← 返回競技場</a><p>PLAYER DOSSIER</p><h1>{player.alias}</h1><span>可觀測分點 {player.broker_code}</span><div>所有張數、成本與持股皆為分點流向的移動平均推估，不是可驗證帳戶餘額。</div></section>
    <section className="split"><FlowTable title="今日前 10 大買進" rows={player.today.buys} side="buy"/><FlowTable title="今日前 10 大賣出" rows={player.today.sells} side="sell"/></section>
    <section className="split"><FlowTable title="近五日累計買進" rows={player.five_days.buys} side="buy"/><FlowTable title="近五日累計賣出" rows={player.five_days.sells} side="sell"/></section>
    <section className="holdings"><p>ESTIMATED INVENTORY · TOP 10</p><h2>歷史推估持股</h2><table><thead><tr><th>個股</th><th>推估張數</th><th>推估成本</th><th>最新價</th><th>推估報酬</th></tr></thead><tbody>{player.holdings.map(x=><tr key={x.stock_code}><td>{x.stock_code} {x.stock_name}</td><td>{x.lots.toLocaleString()} 張</td><td>{x.estimated_cost.toFixed(2)}</td><td>{x.latest_price.toFixed(2)}</td><td className={x.roi_pct>=0?"gain":"loss"}>{money(x.roi_pct)}</td></tr>)}{player.holdings.length===0&&<tr><td colSpan={5}>尚無可用的正向推估庫存。</td></tr>}</tbody></table></section>
    <section className="copy"><p>COPY-TRADING PLAYBOOK · RESEARCH ONLY</p><h2>如何設計跟單</h2><ol><li><b>進場觀察</b><span>{player.copy_plan.entry}</span></li><li><b>部位控制</b><span>{player.copy_plan.sizing}</span></li><li><b>退場紀律</b><span>{player.copy_plan.exit}</span></li></ol><footer>{player.copy_plan.guardrail}<br/>{data.notice}</footer></section>
  </main>;
}
