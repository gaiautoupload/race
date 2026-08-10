import Script from "next/script";

export default function StockPage() {
  return <main className="race stock-page">
    <header><a className="brand" href="/"><i />RACE</a><span>個股情報站</span><small id="asof">載入中</small></header>
    <section className="stock-search-page"><a href="/" className="back-link">← 返回競技場</a><p>STOCK INTELLIGENCE</p><h1>個股主力<br /><em>情報。</em></h1><form id="stock-form"><input id="stock-query" type="search" placeholder="輸入興櫃代號或名稱" autoComplete="off" /><button>搜尋個股</button></form><small>資料來源：官方興櫃分點日報；主力以 RACE 匿名代號呈現。</small></section>
    <section id="stock-result" className="stock-result"><p className="lookup-empty">輸入代號或名稱，查看主力買賣階梯。</p></section>
    <Script src="/stock.js" strategy="afterInteractive" />
  </main>;
}
