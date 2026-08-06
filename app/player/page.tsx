import Script from "next/script";

export default function PlayerPage() {
  return <>
    <main className="race player"><header><a className="brand" href="/"><i />RACE</a><span>選手資料室</span><small id="asof">載入中</small></header><div id="player"><p className="loading">載入選手資料…</p></div></main>
    <Script src="/player.js" strategy="afterInteractive" />
  </>;
}
