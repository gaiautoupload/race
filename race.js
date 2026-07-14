const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const status = v => v === "active" ? "仍在場上" : v === "retired_or_degraded" ? "已降級" : "觀察中";
let players = [], details = {}, tab = "all";

function normalizedCurve(points = []) {
  const usable = points.filter(x => Number.isFinite(Number(x.value)) && Number.isFinite(Number(x.market_value)));
  if (!usable.length) return { values: [], change: 0, min: 100, max: 100 };
  const values = [100];
  for (let i = 1; i < usable.length; i++) {
    const exposure = Math.abs(Number(usable[i - 1].market_value)) || Math.abs(Number(usable[i].market_value)) || 1;
    const dailyReturn = Math.max(-.5, Math.min(.5, (Number(usable[i].value) - Number(usable[i - 1].value)) / exposure));
    values.push(values.at(-1) * (1 + dailyReturn));
  }
  return { values, change: values.at(-1) - 100, min: Math.min(...values), max: Math.max(...values) };
}

function sparkline(points) {
  const c = normalizedCurve(points), w = 320, h = 92, pad = 7;
  if (c.values.length < 2) return "";
  const low = c.min, high = c.max, range = high - low || 1;
  const xy = (v, i) => `${pad + i * (w - pad * 2) / (c.values.length - 1)},${h - pad - (v - low) * (h - pad * 2) / range}`;
  const line = c.values.map(xy).join(" ");
  const baseY = h - pad - (100 - low) * (h - pad * 2) / range;
  const cls = c.change > .05 ? "up" : c.change < -.05 ? "down" : "flat-line";
  return `<figure class="mini-chart ${cls}"><figcaption><span>ASSET CURVE · BASE 100</span><b>${c.change > 0 ? "+" : ""}${c.change.toFixed(1)}%</b></figcaption><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="選手資產成長縮圖"><line x1="${pad}" y1="${baseY}" x2="${w-pad}" y2="${baseY}"/><polyline points="${line}"/></svg><footer><span>最低 <b>${c.min.toFixed(1)}</b></span><span>目前 <b>${(100+c.change).toFixed(1)}</b></span><span>最高 <b>${c.max.toFixed(1)}</b></span></footer></figure>`;
}

function render() {
  const shown = players.filter(p => tab === "all" || p.style === tab);
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

fetch("./public/data/dashboard.json?v=20260714e", {cache:"no-store"}).then(r => r.json()).then(d => {
  players = d.leaderboard || [];
  details = d.players || {};
  document.querySelector("#asof").textContent = `行情日：${d.as_of} · 分點資料：${d.latest_flow_date}`;
  document.querySelector("#notice").textContent = d.notice;
  render();
}).catch(() => document.querySelector("#podium").textContent = "資料暫時無法載入。");
