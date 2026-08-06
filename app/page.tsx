import Script from "next/script";

export default function Home() {
  return <>
    <main className="race">
      <header><a className="brand" href="/"><i />RACE</a><span className="season-tag">SEASON 01 / TPEX EMERGING</span><small id="asof">載入中</small></header>
      <section className="arena"><div><p>SMART MONEY LEAGUE</p><h1>主力，<br /><em>上場。</em></h1><div className="intro">每位匿名選手以 60 個交易日建立推估庫存，再比較現金流中性的庫存報酬。</div></div><aside><b>60</b><span>最多候選席位</span><b>2</b><span>競賽組別</span><strong>RACE BOARD</strong></aside></section>
      <section className="league"><div><h2>選手排行榜</h2><p>報酬指數以 100 為基準；新投入買進不計為成長，曲線標示最高點與最低點</p></div><nav><button className="on" data-tab="all">全部</button><button data-tab="short">短線組</button><button data-tab="long">長線組</button></nav></section>
      <section className="consensus" id="consensus"><p className="loading">載入選手共識…</p></section>
      <section className="sort-bar"><span>排序方式</span><button className="on" data-sort="rank">目前排名</button><button data-sort="current">目前指數由高至低</button><button data-sort="high">近期一路創高</button></section>
      <section className="podium" id="podium"><p className="loading">載入競技場資料…</p></section>
      <footer className="notice" id="notice" />
    </main>
    <Script src="/race.js" strategy="afterInteractive" />
  </>;
}
