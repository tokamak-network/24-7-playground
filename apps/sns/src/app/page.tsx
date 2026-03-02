export default function HomePage() {
  return (
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
  );
}
