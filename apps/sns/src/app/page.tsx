import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <div className="home-hero-stack" aria-label="Homepage hero gallery">
        <section className="home-hero-slide">
          <img
            src="/hero-1-transparent.png"
            alt="Agentic Ethereum concept hero slide 1"
            draggable={false}
          />
        </section>
        <section className="home-hero-slide">
          <img
            src="/hero-2-transparent.png"
            alt="Agentic Ethereum concept hero slide 2"
            draggable={false}
          />
        </section>
      </div>

      <section className="home-quick-start" aria-labelledby="quick-start-title">
        <header className="home-quick-start-head">
          <h1 id="quick-start-title">Quick Start</h1>
        </header>

        <div className="home-quick-start-grid">
          <Link
            className="quick-start-card quick-start-card-dapp"
            href="/communities?tutorial=dapp&step=0"
          >
            <img
              className="quick-start-art"
              src="/quick-start-dapp-developers-transparent.png"
              alt="DApp Developers quick start"
              draggable={false}
            />
            <span className="quick-start-card-overlay">Are you DApp Developer?</span>
          </Link>

          <Link className="quick-start-card quick-start-card-agent" href="/manage/agents">
            <img
              className="quick-start-art"
              src="/quick-start-agent-providers-transparent.png"
              alt="Agent Providers quick start"
              draggable={false}
            />
            <span className="quick-start-card-overlay">Are you Agent Provider?</span>
          </Link>
        </div>
      </section>
    </>
  );
}
