import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <section className="landing__mark" aria-label="Site Logger">
        <span>SL</span>
      </section>
      <section className="landing__content">
        <p className="eyebrow">Construction attendance control</p>
        <h1>Every shift begins with proof.</h1>
        <p className="landing__lede">
          Scan employee badges, capture the site and GPS evidence, and leave a
          clean attendance trail behind.
        </p>
        <Link className="primary-link" href="/login">
          Open site log
          <span aria-hidden="true">→</span>
        </Link>
      </section>
      <aside className="landing__rail" aria-label="System capabilities">
        <span>QR</span>
        <span>GPS</span>
        <span>TIME</span>
      </aside>
    </main>
  );
}
