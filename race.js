const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const status = v => v === "active" ? "仍在場上" : v === "retired_or_degraded" ? "已降級" : "觀察中";
let players = [], details = {}, tab = "all", curveDomain = null;

function normalizedCurve(points = []) {
  const usable = points.filter(x => Number.isFinite(Number(x.value)));
  if (!usable.length) return { values: [], change: 0, min: 100, max: 100 };
  const baselinePoint = usable.find(x => Number(x.value) !== 0) || usable[0];
  const baseline = Math.abs(Number(baselinePoint.value)) || 1;
  const values = usable.map(x => 100 + (Number(x.value) - Number(baselinePoint.value)) / baseline * 100);
  return { values, change: values.at(-1) - 100, min: Math.min(...values), max: Math.max(...values) };
}

function sparkline(points) {
  const c = normalizedCurve(points), w = 320, h = 128, pad = 6;
  if (c.values.length < 2) return "";
  const low = curveDomain?.min ?? c.min, high = curveDomain?.max ?? c.max, range = high - low || 1;
  const xy = (v, i) => `${pad + i * (w - pad * 2) / (c.values.length - 1)},${h - pad - (v - low) * (h - pad * 2) / range}`;
  const line = c.values.map(xy).join(" ");
  const cls = c.change > .05 ? "up" : c.change < -.05 ? "down" : "flat-line";
  return `<svg class="card-curve ${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${line}"/></svg><span class="curve-change ${cls}">${c.change > 0 ? "+" : ""}${c.change.toFixed(1)}%</span>`;
}

function render() {
  const shown = players.filter(p => tab === "all" || p.style === tab);
  const curves = shown.map(p => normalizedCurve(details[p.player_id]?.equity_curve || []));
  curveDomain = {min: Math.min(100, ...curves.map(c => c.min)), max: Math.max(100, ...curves.map(c => c.max))};
  document.querySelector("#podium").innerHTML = shown.map(p => {
    const curve = details[p.player_id]?.equity_curve || [];
    return `<a class="fighter ${p.style}" href="./player/?code=${encodeURIComponent(p.player_id)}&v=20260714e">${sparkline(curve)}<div class="fighter-content"><mark>#${String(p.rank).padStart(2,"0")}</mark><div class="rank-orb">${String(p.rank).padStart(2,"0")}</div><p>${p.style === "long" ? "LONG GAME" : "SPRINT"}</p><h2>${esc(p.alias)}</h2><small>${status(p.health)} · 歷史戰役 ${p.lifetime_trades}</small><dl><div><dt>近90日勝率</dt><dd>${Number(p.recent_win_rate_pct).toFixed(1)}%</dd></div><div><dt>近90日 ROI</dt><dd class="${p.recent_avg_roi_pct > 0 ? "gain" : p.recent_avg_roi_pct < 0 ? "loss" : "flat"}">${p.recent_avg_roi_pct > 0 ? "+" : ""}${Number(p.recent_avg_roi_pct).toFixed(1)}%</dd></div></dl><footer><span>${p.style === "long" ? "長線庫存選手" : "短線戰役選手"}</span><b>查看選手檔案 →</b></footer></div></a>`;
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
