import { Target, Palette, Users, BarChart3, ShieldCheck, Handshake, Rocket, Clock } from "lucide-react";
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

const SERVICES = [
  {
    icon: Target,
    title: "Gestión de Campañas",
    text: "Creamos y administramos tus anuncios en Facebook, Instagram y TikTok para maximizar tu retorno de inversión.",
  },
  {
    icon: Palette,
    title: "Diseño de Creatividades",
    text: "Diseñamos imágenes y videos publicitarios que capturan la atención de tu audiencia.",
  },
  {
    icon: Users,
    title: "Segmentación de Audiencia",
    text: "Llegamos exactamente a las personas que están buscando lo que ofreces.",
  },
  {
    icon: BarChart3,
    title: "Reportes de Resultados",
    text: "Recibe reportes claros del desempeño de tus campañas, sin tecnicismos.",
  },
] as const;

function Services() {
  return (
    <section className="bg-[color:var(--color-cream-dark)] px-5 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-center text-3xl font-bold text-[color:var(--color-ink)]">
          Qué hacemos por tu negocio
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {SERVICES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-[color:var(--color-cream)] p-6 shadow-sm">
              <Icon className="h-8 w-8 text-[color:var(--color-brand)]" />
              <h3 className="mt-4 text-lg font-semibold text-[color:var(--color-ink)]">{title}</h3>
              <p className="mt-2 text-[color:var(--color-ink-soft)]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { title: "Contáctanos", text: "Escríbenos por WhatsApp y cuéntanos sobre tu negocio." },
  { title: "Definimos tu estrategia", text: "Creamos un plan de publicidad a la medida de tus objetivos." },
  { title: "Lanzamos tu campaña", text: "Ponemos en marcha tus anuncios en las plataformas correctas." },
  { title: "Ves resultados", text: "Recibes reportes y ajustamos la estrategia para mejorar continuamente." },
] as const;

function HowItWorks() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-center text-3xl font-bold text-[color:var(--color-ink)]">
          Cómo funciona
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ title, text }, i) => (
            <div key={title} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-brand)] font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mt-3 font-semibold text-[color:var(--color-ink)]">{title}</h3>
              <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const WHY_US = [
  { icon: Handshake, title: "Atención personalizada", text: "Hablamos directo contigo, sin intermediarios ni bots." },
  { icon: ShieldCheck, title: "Pagos seguros", text: "Aceptamos PayPal para que pagues con total confianza." },
  { icon: Clock, title: "Sin contratos largos", text: "Trabajamos mes a mes, sin ataduras." },
  { icon: Rocket, title: "Enfoque en resultados", text: "Medimos todo para que tu inversión valga la pena." },
] as const;

function WhyUs() {
  return (
    <section className="bg-[color:var(--color-cream-dark)] px-5 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-center text-3xl font-bold text-[color:var(--color-ink)]">
          Por qué elegirnos
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-[color:var(--color-cream)] p-6 text-center shadow-sm">
              <Icon className="mx-auto h-8 w-8 text-[color:var(--color-brand)]" />
              <h3 className="mt-3 font-semibold text-[color:var(--color-ink)]">{title}</h3>
              <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-5 py-16 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="font-display text-3xl font-bold text-[color:var(--color-ink)]">
          ¿Listo para hacer crecer tu negocio?
        </h2>
        <p className="mt-3 text-[color:var(--color-ink-soft)]">
          Escríbenos ahora y arma tu estrategia de publicidad.
        </p>
        <div className="mt-6 flex justify-center">
          <WhatsAppButton />
        </div>
      </div>
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
      <Services />
      <HowItWorks />
      <WhyUs />
      <FinalCta />
      <Footer />
    </main>
  );
}
