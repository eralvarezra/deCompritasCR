import { WhatsAppButton } from "@/components/WhatsAppButton";
import { TrustBadges } from "@/components/TrustBadges";

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--color-hairline)] bg-[color:var(--color-cream)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <span className="font-display text-xl font-bold text-[color:var(--color-brand-dark)]">
          DeCompritas
        </span>
        <WhatsAppButton className="!px-4 !py-2 text-sm" label="WhatsApp" />
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-5 pb-12 pt-14 text-center sm:pt-20">
      <p className="font-semibold uppercase tracking-wide text-[color:var(--color-brand)]">
        Agencia de Publicidad en Redes Sociales
      </p>
      <h1 className="font-display mt-3 text-4xl font-bold leading-tight text-[color:var(--color-ink)] sm:text-5xl">
        Haz crecer tu negocio con campañas que sí funcionan
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-[color:var(--color-ink-soft)]">
        Gestionamos tus anuncios en Facebook, Instagram y TikTok para que tu negocio
        llegue a más clientes, sin complicaciones.
      </p>
      <div className="mt-8 flex justify-center">
        <WhatsAppButton />
      </div>
      <TrustBadges className="mt-10" />
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-hairline)] px-5 py-10 text-center">
      <span className="font-display text-lg font-bold text-[color:var(--color-brand-dark)]">
        DeCompritas
      </span>
      <TrustBadges className="mt-4" />
      <p className="mt-6 text-sm text-[color:var(--color-ink-soft)]">
        &copy; {new Date().getFullYear()} DeCompritas. Todos los derechos reservados.
      </p>
    </footer>
  );
}

export default function Page() {
  return (
    <main>
      <Header />
      <Hero />
      <Footer />
    </main>
  );
}
