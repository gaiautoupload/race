const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const money = v => Number.isFinite(Number(v)) ? `${Math.abs(Number(v)) / 10000 >= 10000 ? (Math.abs(Number(v)) / 100000000).toFixed(2) + " 億" : (Math.abs(Number(v)) / 10000).toFixed(0) + " 萬"}` : "—";

const stats = s => !s.has_data ? `<div class="no-period-data">此期間沒有可觀測分點成交資料</div>` : `<div class="stat-grid"><div class="buy-stat"><small>淨買進金額</small><b>${esc(s.buy_amount_label || money(s.buy_amount))}</b><span>${Number(s.buy_lots || 0).toLocaleString()} 張 · 加權均價 ${Number(s.buy_avg_price || 0).toFixed(2)}</span></div><div class="sell-stat"><small>淨賣出金額</small><b>${esc(s.sell_amount_label || money(s.sell_amount))}</b><span>${Number(s.sell_lots || 0).toLocaleString()} 張 · 加權均價 ${Number(s.sell_avg_price || 0).toFixed(2)}</span></div><div><small>淨流向</small><b class="${s.net_amount > 0 ? "gain" : s.net_amount < 0 ? "loss" : "flat"}">${s.net_amount > 0 ? "+" : s.net_amount < 0 ? "−" : ""}${money(s.net_amount)}</b><span>${s.net_amount > 0 ? "偏多掃貨" : s.net_amount < 0 ? "偏空出貨" : "持平"}</span></div></div>`;

const flowTable = (rows, side) => `<table class="flow-table"><thead><tr><th>#</th><th>個股</th><th>淨額</th><th>淨張數</th><th>加權均價</th></tr></thead><tbody>${rows.length ? rows.map((x, i) => `<tr class="${side}"><td>${x.rank || i + 1}</td><td><strong>${esc(x.stock_code)}</strong> ${esc(x.stock_name)}</td><td>${esc(x.amount_label)}<small class="wan">${Number(x.amount_wan || 0).toLocaleString()} 萬</small></td><td>${Number(x.lots).toLocaleString()} 張</td><td>${Number(x.avg_price || 0).toFixed(2)}</td></tr>`).join("") : `<tr><td colspan="5">此期間沒有可觀測成交資料</td></tr>`}</tbody></table>`;

const spotlight = (title, rows, kind) => `<section class="spotlight ${kind}"><div><p>${kind === "buy" ? "TOP NET BUY · 大量掃貨" : "TOP NET SELL · 大量出貨"}</p><h2>${title}</h2></div>${rows.length ? `<div class="spot-items">${rows.slice(0, 3).map((x, i) => `<div><em>${i + 1}</em><b>${esc(x.stock_code)} ${esc(x.stock_name)}</b><span>${esc(x.amount_label)} · ${Number(x.lots).toLocaleString()} 張</span></div>`).join("")}</div>` : `<div class="empty">目前沒有大額紀錄</div>`}</section>`;

function normalized(points = []) {
  const usable = points.filter(x => Number.isFinite(Number(x.value)));
  if (!usable.length) return {points:[], min:100, max:100, last:100, change:0};
  const basePoint = usable.find(x => Number(x.value) !== 0) || usable[0];
  const base = Math.abs(Number(basePoint.value)) || 1;
  const values = usable.map(x => ({date:x.date, value:100 + (Number(x.value) - Number(basePoint.value)) / base * 100}));
  return {points:values, min:Math.min(...values.map(x=>x.value)), max:Math.max(...values.map(x=>x.value)), last:values.at(-1).value, change:values.at(-1).value - 100};
}

function chart(points) {
  const c = normalized(points), w = 900, h = 260, px = 42, py = 24;
  if (c.points.length < 2) return `<div class="empty chart-empty">尚無累計曲線資料</div>`;
  const low = Math.min(c.min, 100), high = Math.max(c.max, 100), range = high - low || 1;
  const xy = (v, i) => `${px + i * (w - px * 2) / (c.points.length - 1)},${h - py - (v - low) * (h - py * 2) / range}`;
  const baseY = h - py - (100 - low) * (h - py * 2) / range;
  const line = c.points.map((x, i) => xy(x.value, i)).join(" ");
  const cls = c.change > .05 ? "up" : c.change < -.05 ? "down" : "flat-line";
  return `<div class="chart-summary"><span>起始基準 <b>100.0</b></span><span>最高 <b>${c.max.toFixed(1)}</b></span><span>最低 <b>${c.min.toFixed(1)}</b></span><span>目前 <b class="${cls}">${c.last.toFixed(1)}（${c.change > 0 ? "+" : ""}${c.change.toFixed(1)}%）</b></span></div><svg class="equity-chart ${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="以起始資產為100的累計資產曲線"><line x1="${px}" y1="${baseY}" x2="${w-px}" y2="${baseY}" class="baseline"/><text x="${px+4}" y="${baseY-7}" class="base-label">基準 100</text><polyline points="${line}"/><circle cx="${w-px}" cy="${xy(c.last,c.points.length-1).split(",")[1]}" r="5"/><text x="${px}" y="${h-4}">${esc(c.points[0].date)}</text><text x="${w-px}" y="${h-4}" text-anchor="end">${esc(c.points.at(-1).date)}</text></svg><div class="chart-caption">以第一個有效資產值設為 100；曲線已包含持股市值、累計買進與累計賣出。</div>`;
}

const code = new URLSearchParams(location.search).get("code");
fetch("../public/data/dashboard.json?v=20260714e", {cache:"no-store"}).then(r => r.json()).then(d => {
  const p = d.players[code];
  if (!p) { document.querySelector("#player").textContent = "找不到選手資料，請由排行榜重新選擇。"; return; }
  const t = p.today, f = p.five_days;
  document.querySelector("#asof").textContent = `行情日：${p.market_date || "—"} · 最近分點資料：${p.latest_flow_date}`;
  document.querySelector("#player").innerHTML = `<section class="player-hero"><a href="../">← 返回競技場</a><p>PLAYER DOSSIER</p><h1>${esc(p.alias)}</h1><span>匿名選手 · 單日／五日／歷史戰績</span><div>同一標的先將買賣互抵，再依淨買或淨賣歸類。</div></section><section class="spotlight-grid">${spotlight("推薦買入", t.recommended_buy || t.buys, "buy")}${spotlight("建議賣出", t.recommended_sell || t.sells, "sell")}</section><section class="period"><div class="period-head"><p>TODAY · ${esc(p.latest_flow_date)}</p><h2>今日戰績</h2></div>${stats(t.stats || {})}<div class="split"><section class="flow-card buy"><h3>單日淨買進排行</h3>${flowTable(t.buys, "buy")}</section><section class="flow-card sell"><h3>單日淨賣出排行</h3>${flowTable(t.sells, "sell")}</section></div></section><section class="period"><div class="period-head"><p>LAST 5 TRADING DAYS</p><h2>五日戰績</h2></div>${stats(f.stats || {})}<div class="split"><section class="flow-card buy"><h3>五日淨買進排行</h3>${flowTable(f.buys, "buy")}</section><section class="flow-card sell"><h3>五日淨賣出排行</h3>${flowTable(f.sells, "sell")}</section></div></section><section class="equity"><p>EQUITY CURVE · BASE 100</p><h2>資產成長曲線</h2>${chart(p.equity_curve)}</section><section class="holdings"><p>HISTORICAL INVENTORY · TOP 10</p><h2>歷史推估持股</h2><table><thead><tr><th>個股</th><th>最早買入</th><th>最新買入</th><th>推估張數</th><th>平均成本（萬／張）</th><th>最新價</th><th>推估報酬</th></tr></thead><tbody>${p.holdings.length ? p.holdings.map(x => `<tr><td>${esc(x.stock_code)} ${esc(x.stock_name)}${x.settlement ? `<small class="settled">${esc(x.settlement_note)}</small>` : ""}</td><td>${esc(x.first_buy_date || "—")}</td><td>${esc(x.latest_buy_date || "—")}</td><td>${Number(x.lots).toLocaleString()} 張</td><td>${Number(x.average_cost_wan_per_lot).toFixed(2)}</td><td>${Number(x.latest_price).toFixed(2)}</td><td class="${x.roi_pct > 0 ? "gain" : x.roi_pct < 0 ? "loss" : "flat"}">${x.roi_pct > 0 ? "+" : ""}${Number(x.roi_pct).toFixed(1)}%</td></tr>`).join("") : `<tr><td colspan="7">尚無可用的正向推估庫存。</td></tr>`}</tbody></table></section><section class="copy"><p>COPY-TRADING PLAYBOOK · RESEARCH ONLY</p><h2>如何設計跟單</h2><ol><li><b>進場觀察</b><span>${esc(p.copy_plan.entry)}</span></li><li><b>部位控制</b><span>${esc(p.copy_plan.sizing)}</span></li><li><b>退場紀律</b><span>${esc(p.copy_plan.exit)}</span></li></ol><footer>${esc(p.copy_plan.guardrail)}<br>${esc(d.notice)}</footer></section>`;
}).catch(() => document.querySelector("#player").textContent = "資料暫時無法載入。");
