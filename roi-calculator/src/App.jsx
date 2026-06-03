import ROICalculator from './components/ROICalculator'

export default function App() {
  return (
    <div className="page-wrap">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="logo">lunarlogic</div>
          <a
            className="header-cta"
            href="https://calendly.com/jrodriguez-lunarlogic/30min"
            target="_blank"
            rel="noreferrer"
          >
            Book a Call
          </a>
        </div>
      </header>

      <section className="hero-band">
        <div className="hero-band-inner">
          <div className="hero-eyebrow">Free ROI Calculator</div>
          <h1 className="hero-headline">
            How much is slow AR<br />costing you?
          </h1>
          <p className="hero-sub">
            Answer four quick questions and get a personalised estimate of the
            cash flow, time, and revenue you could recover with LunarLogic.
            Takes&nbsp;2&nbsp;minutes.
          </p>
        </div>
      </section>

      <main className="calc-shell">
        <ROICalculator />
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <span>© 2026 LunarLogic · AR Automation Platform</span>
          <a href="mailto:jrodriguez@lunarlogic.ai">jrodriguez@lunarlogic.ai</a>
        </div>
      </footer>
    </div>
  )
}
