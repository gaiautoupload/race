const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const status = v => v === "active" ? "仍在場上" : v === "retired_or_degraded" ? "已降級" : "觀察中";
let players = [], details = {}, tab = "all", sortMode = "rank";
let consensus = {};

function normalizedCurve(points = []) {
  const usable = points.filter(x => Number.isFinite(Number(x.return_index ?? x.value)));
  if (!usable.length) return { values: [], change: 0, min: 100, max: 100 };
  const values = usable.map(x => Number(x.return_index ?? x.value));
  return { values, change: values.at(-1) - 100, min: Math.min(...values), max: Math.max(...values) };
}

function sparkline(points) {
  const c = normalizedCurve(points), w = 320, h = 92, pad = 7;
  if (c.values.length < 2) return "";
  const low = c.min, high = c.max, range = high - low || 1;
  const point = (v, i) => ({x:pad + i * (w - pad * 2) / (c.values.length - 1), y:h - pad - (v - low) * (h - pad * 2) / range});
  const xy = (v, i) => { const p = point(v, i); return `${p.x},${p.y}`; };
  const line = c.values.map(xy).join(" ");
  const baseY = h - pad - (100 - low) * (h - pad * 2) / range;
  const cls = c.change > .05 ? "up" : c.change < -.05 ? "down" : "flat-line";
  const extreme = (kind, value, index) => { const p = point(value, index), boxW = 54, boxH = 15, x = Math.max(2, Math.min(w-boxW-2, p.x-boxW/2)), y = kind === "max" ? Math.max(2,p.y-boxH-5) : Math.min(h-boxH-2,p.y+5); return `<g class="extreme ${kind}"><circle cx="${p.x}" cy="${p.y}" r="3.5"/><rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="3"/><text x="${x+boxW/2}" y="${y+10.5}" text-anchor="middle">${value.toFixed(1)}</text></g>`; };
  return `<figure class="mini-chart ${cls}"><figcaption><span>ASSET CURVE · BASE 100</span><b>${c.change > 0 ? "+" : ""}${c.change.toFixed(1)}%</b></figcaption><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="選手資產成長縮圖"><line x1="${pad}" y1="${baseY}" x2="${w-pad}" y2="${baseY}"/><polyline points="${line}"/>${extreme("max",c.max,c.values.indexOf(c.max))}${extreme("min",c.min,c.values.indexOf(c.min))}</svg><footer><span>最低 <b>${c.min.toFixed(1)}</b></span><span>目前 <b>${(100+c.change).toFixed(1)}</b></span><span>最高 <b>${c.max.toFixed(1)}</b></span></footer></figure>`;
}

function curveValues(player) {
  return normalizedCurve(details[player.player_id]?.equity_curve || []).values;
}

function recentHighScore(player) {
  const values = curveValues(player);
  if (values.length < 2) return -Infinity;
  const recent = values.slice(-Math.min(12, values.length));
  const first = recent[0] || 100;
  const change = (recent.at(-1) - first) / Math.abs(first || 1) * 100;
  const risingDays = recent.slice(1).filter((value, i) => value >= recent[i]).length / Math.max(1, recent.length - 1) * 20;
  let runningHigh = recent[0], newHighs = 0;
  for (const value of recent.slice(1)) { if (value > runningHigh) { runningHigh = value; newHighs++; } }
  return change + risingDays + newHighs * 2;
}

function sortPlayers(list) {
  if (sortMode === "current") return [...list].sort((a, b) => (curveValues(b).at(-1) ?? 100) - (curveValues(a).at(-1) ?? 100));
  if (sortMode === "high") return [...list].sort((a, b) => recentHighScore(b) - recentHighScore(a));
  return list;
}

function consensusSection(title, rows, tone, emptyText) {
  return `<section class="consensus-card ${tone}"><p>${title}</p>${rows?.length ? `<div class="consensus-list">${rows.slice(0, 6).map(x => `<div><b>${esc(x.stock_code)} ${esc(x.stock_name)}</b><span>${x.supporters} 位選手 · ${Number(x.lots || 0).toLocaleString()} 張 · 約 ${Number(x.amount_wan || 0).toLocaleString()} 萬</span><small>${(x.aliases || []).map(esc).join("、")}</small></div>`).join("")}</div>` : `<div class="consensus-empty">${emptyText}</div>`}</section>`;
}

function renderConsensus() {
  const target = document.querySelector("#consensus");
  if (!target) return;
  target.innerHTML = consensusSection("多數選手新建倉", consensus.new_positions, "new", "近期沒有形成共識的新建倉標的") + consensusSection("共同推薦買入", consensus.common_buy, "buy", "目前沒有共同淨買標的") + consensusSection("共同棄養／淨賣出", consensus.common_abandon, "sell", "目前沒有共同淨賣標的");
}

function render() {
  const shown = sortPlayers(players.filter(p => tab === "all" || p.style === tab));
  document.querySelector("#podium").innerHTML = shown.map(p => {
    const curve = details[p.player_id]?.equity_curve || [];
    return `<a class="fighter ${p.style}" href="./player/?code=${encodeURIComponent(p.player_id)}&v=20260715a"><div class="fighter-content"><mark>#${String(p.rank).padStart(2,"0")}</mark><div class="rank-orb">${String(p.rank).padStart(2,"0")}</div><p>${p.style === "long" ? "LONG GAME" : "SPRINT"}</p><h2>${esc(p.alias)}</h2><small>${status(p.health)} · 歷史戰役 ${p.lifetime_trades}</small><dl><div><dt>近90日勝率</dt><dd>${Number(p.recent_win_rate_pct).toFixed(1)}%</dd></div><div><dt>近90日 ROI</dt><dd class="${p.recent_avg_roi_pct > 0 ? "gain" : p.recent_avg_roi_pct < 0 ? "loss" : "flat"}">${p.recent_avg_roi_pct > 0 ? "+" : ""}${Number(p.recent_avg_roi_pct).toFixed(1)}%</dd></div></dl>${sparkline(curve)}<footer><span>${p.style === "long" ? "長線庫存選手" : "短線戰役選手"}</span><b>查看選手檔案 →</b></footer></div></a>`;
  }).join("") || "<p class='loading'>此組目前沒有合格選手。</p>";
}

document.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => {
  tab = b.dataset.tab;
  document.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("on", x === b));
  render();
}));

document.querySelectorAll("[data-sort]").forEach(b => b.addEventListener("click", () => {
  sortMode = b.dataset.sort;
  document.querySelectorAll("[data-sort]").forEach(x => x.classList.toggle("on", x === b));
  render();
}));

fetch("./public/data/dashboard.json?v=20260715d", {cache:"no-store"}).then(r => r.json()).then(d => {
  players = d.leaderboard || [];
  details = d.players || {};
  consensus = d.consensus || {};
  document.querySelector("#asof").textContent = `行情日：${d.as_of} · 分點資料：${d.latest_flow_date}`;
  document.querySelector("#notice").textContent = d.notice;
  renderConsensus();
  render();
}).catch(() => document.querySelector("#podium").textContent = "資料暫時無法載入。");
