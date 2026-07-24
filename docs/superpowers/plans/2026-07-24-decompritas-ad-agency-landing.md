# DeCompritas Ad-Agency Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing DeCompritas e-commerce store (Next.js + Supabase, product
catalog, cart, checkout, admin panel, Telegram notifications) at `decompritascr.com`
with a single-page, static, mobile-first landing page for a social-media-ad-management
agency, with WhatsApp as the only contact channel and PayPal shown purely as a trust
badge (no real payment processing).

**Architecture:** Same Next.js 16 + Tailwind v4 app, same Docker/Traefik deployment
already live for this domain (root-level `Dockerfile` + `docker-compose.yml`, service
name `app`, container `decompritascr-app-1`). All Supabase/cart/checkout/admin/API code
is deleted; the app becomes a single static route (`src/app/page.tsx`) with two small
reusable components (`WhatsAppButton`, `TrustBadges`). No database, no API routes, no
environment variables required at runtime.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, `lucide-react`
(icons), `clsx` (kept, via `cn()` in `src/lib/utils.ts`). Node 20 (matches the existing
Dockerfile). No test framework in this project — verification is `npm run build`
succeeding (this project's only automated check) plus a live browser check against the
deployed site, exactly as established for every other change made on this VPS this
session.

## Global Constraints

- PayPal is branding/trust-messaging only — **no PayPal SDK, no checkout, no payment
  processing of any kind.**
- The only contact channel is WhatsApp — **no contact form, no backend, no database.**
- The WhatsApp number is a placeholder, `506XXXXXXXX` (deliberately non-numeric-looking
  so an accidental deploy is obviously broken, not a plausible-looking fake number) —
  every place it appears must be visibly marked for replacement before the site goes
  live for real.
- No prices/packages are shown publicly — every CTA leads to "cotización
  personalizada" via WhatsApp.
- Keep the "DeCompritas" name. Do not reuse the old store logo (`public/logo.png`) as
  the brand mark — use a text wordmark instead.
- **Never fabricate testimonials, client logos, case studies, or results/stats.** If a
  section would need real content that doesn't exist yet, omit the section entirely
  rather than inventing placeholder claims that read as real business claims.
- All SSH/deploy commands to the server use
  `-o ControlPath=/tmp/ssh-schn-%r@%h root@135.181.37.72`; if that control socket is
  down, reconnect first with
  `sshpass -p '53403E@@r' ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 -o ControlMaster=auto -o ControlPath=/tmp/ssh-schn-%r@%h -o ControlPersist=900 root@135.181.37.72 'echo RECONNECTED'`.
- The project lives at `/root/deCompritasCR` on the server, its own git repo (remote
  `https://github.com/eralvarezra/deCompritasCR.git`), branch `main`. Commit only the
  files explicitly listed per task — this repo has pre-existing uncommitted files
  unrelated to this rebuild; do not `git add -A` or `git add .`.
- The live container is driven by the **root-level** `docker-compose.yml` (service
  `app`) and root-level `Dockerfile` — **not** the `deploy/` subdirectory's compose
  file/Dockerfile.production, which is an unused leftover scaffold from an earlier,
  different deployment approach.

---

### Task 1: Tear down the old app, land the new page's foundation

**Files:**
- Delete: `src/app/api/` (entire directory)
- Delete: `src/app/admin/` (entire directory)
- Delete: `src/lib/supabase/` (entire directory)
- Delete: `src/lib/telegram.ts`
- Delete: `src/lib/weekly-report.ts`
- Delete: `src/lib/demo-store.ts`
- Delete: `src/types/database.types.ts`
- Delete: `src/types/database.types.ts.bak`
- Delete: `src/components/product/` (entire directory)
- Delete: `src/components/cart/` (entire directory)
- Delete: `src/components/checkout/` (entire directory)
- Delete: `src/components/DynamicTitle.tsx`
- Delete: `src/components/index.ts`
- Delete: `src/context/CartContext.tsx`
- Delete: `src/context/StoreContext.tsx`
- Delete: `supabase/` (entire directory — `schema.sql` + `migrations/`)
- Delete: `public/uploads/` (entire directory)
- Delete: `public/logo.png`
- Delete: `public/manifest.json`
- Delete: `"Logo de Compritas ONLINE SHOP.png"` (repo root — unused asset, not
  referenced anywhere in `src/`)
- Delete: `.env.build`, `.env.build.indira` (untracked stray files at repo root, only
  relevant to the old Supabase build-arg passing)
- Modify: `src/lib/utils.ts` (remove the now-unused `formatPrice`/`formatPhone`/
  `validatePhone` helpers — they were only used by the deleted product/cart/checkout/
  admin/telegram code; keep `cn()`)
- Modify: `src/app/globals.css` (new color tokens, remove the checkout-specific
  `fly-to-cart` animation)
- Modify: `src/app/layout.tsx` (new metadata, remove `StoreProvider`/`DynamicTitle`,
  mount the floating WhatsApp button globally)
- Modify: `src/app/page.tsx` (full rewrite — Header, Hero, Footer only in this task;
  remaining sections come in Task 2)
- Modify: `package.json` (remove `@supabase/ssr`, `@supabase/supabase-js`,
  `jsonwebtoken`, `exceljs`, `@types/jsonwebtoken`)
- Create: `src/components/WhatsAppButton.tsx`
- Create: `src/components/TrustBadges.tsx`

**Interfaces:**
- Produces: `WhatsAppButton({ variant?: 'button' | 'floating', className?: string, label?: string })` — a `<WhatsAppButton />` React component. Default `variant` is `'button'`.
- Produces: `TrustBadges({ className?: string })` — a `<TrustBadges />` React component rendering 3 trust badges (security / PayPal / results).
- Consumes: `cn()` from `src/lib/utils.ts` (unchanged signature).

This task deletes everything that the old app needed and stands up just enough of the
new page (Header + Hero + Footer + the two new shared components) that the project
builds and runs again. Task 2 fills in the remaining sections.

- [ ] **Step 1: Delete the old backend, admin, and e-commerce-specific frontend code**

```bash
ssh -o ControlPath=/tmp/ssh-schn-%r@%h root@135.181.37.72 '
cd /root/deCompritasCR &&
rm -rf src/app/api &&
rm -rf src/app/admin &&
rm -rf src/lib/supabase &&
rm -f src/lib/telegram.ts src/lib/weekly-report.ts src/lib/demo-store.ts &&
rm -f src/types/database.types.ts src/types/database.types.ts.bak &&
rm -rf src/components/product src/components/cart src/components/checkout &&
rm -f src/components/DynamicTitle.tsx src/components/index.ts &&
rm -f src/context/CartContext.tsx src/context/StoreContext.tsx &&
rm -rf supabase &&
rm -rf public/uploads &&
rm -f public/logo.png public/manifest.json &&
rm -f "Logo de Compritas ONLINE SHOP.png" &&
rm -f .env.build .env.build.indira &&
echo DELETE_DONE
'
```

Expected output: `DELETE_DONE` with no error lines above it.

- [ ] **Step 2: Replace `src/lib/utils.ts` — keep only `cn()`**

```typescript
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
```

- [ ] **Step 3: Create `src/components/WhatsAppButton.tsx`**

```typescript
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// REEMPLAZAR antes de publicar: número real de WhatsApp (código de país + número,
// solo dígitos, sin espacios ni símbolos — ej. 50688887777). El valor de abajo es
// deliberadamente no numérico para que un link roto sea obvio si se despliega sin
// reemplazarlo.
const WHATSAPP_NUMBER = '506XXXXXXXX'
const WHATSAPP_MESSAGE =
  'Hola, quiero información sobre sus servicios de publicidad en redes sociales.'

function whatsAppLink(): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
}

interface WhatsAppButtonProps {
  variant?: 'button' | 'floating'
  className?: string
  label?: string
}

export function WhatsAppButton({
  variant = 'button',
  className,
  label = 'Cotizar por WhatsApp',
}: WhatsAppButtonProps) {
  if (variant === 'floating') {
    return (
      <a
        href={whatsAppLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className={cn(
          'fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center',
          'rounded-full bg-[color:var(--color-whatsapp)] text-white',
          'shadow-lg shadow-black/20 transition-transform hover:scale-105',
          className
        )}
      >
        <MessageCircle className="h-7 w-7" fill="white" />
      </a>
    )
  }

  return (
    <a
      href={whatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full',
        'bg-[color:var(--color-whatsapp)] px-6 py-3 font-semibold text-white',
        'shadow-md transition-transform hover:scale-105',
        className
      )}
    >
      <MessageCircle className="h-5 w-5" fill="white" />
      {label}
    </a>
  )
}
```

- [ ] **Step 4: Create `src/components/TrustBadges.tsx`**

```typescript
import { ShieldCheck, CreditCard, BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const BADGES = [
  { icon: ShieldCheck, text: 'Pagos 100% seguros' },
  { icon: CreditCard, text: 'Aceptamos PayPal' },
  { icon: BadgeCheck, text: 'Resultados medibles' },
] as const

export function TrustBadges({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-x-8 gap-y-3', className)}>
      {BADGES.map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-2 text-sm font-medium text-[color:var(--color-ink-soft)]">
          <Icon className="h-5 w-5 text-[color:var(--color-brand)]" />
          {text}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Replace `src/app/globals.css`**

```css
@import "tailwindcss";

/* -----------------------------------------------------------
   Design tokens (Tailwind v4 @theme)
   ----------------------------------------------------------- */
@theme {
  --font-display: var(--font-playfair), ui-serif, Georgia, serif;
  --font-sans: var(--font-quicksand), ui-sans-serif, system-ui, sans-serif;

  /* Brand — PayPal-adjacent blue, for trust/payment association */
  --color-brand: #0070ba;
  --color-brand-soft: #2f8fcf;
  --color-brand-dark: #003087;
  --color-brand-tint: #eaf4fb;

  --color-whatsapp: #25d366;

  --color-cream: #f7fafc;
  --color-cream-dark: #eaf1f6;
  --color-ink: #0f1b2d;
  --color-ink-soft: #4a5b6b;
  --color-hairline: #e2ecf2;
}

@layer base {
  :root {
    --background: #f7fafc;
    --foreground: #0f1b2d;
  }

  * {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
  }

  html {
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
  }

  body {
    background: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overscroll-behavior: none;
  }

  h1, h2, h3, .font-display {
    font-family: var(--font-display);
    letter-spacing: -0.01em;
  }

  @media (max-width: 768px) {
    input, select, textarea {
      font-size: 16px;
    }
  }
}

@layer utilities {
  .safe-bottom {
    padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
  }
  .safe-top {
    padding-top: env(safe-area-inset-top);
  }
}

@layer components {
  .animate-in   { animation: animate-in 0.2s ease-out; }
  .stagger-in   { animation: stagger-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }

  @keyframes animate-in {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes stagger-in {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 6: Replace `src/app/layout.tsx`**

```typescript
import type { Metadata, Viewport } from "next";
import { Playfair_Display, Quicksand } from "next/font/google";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DeCompritas — Publicidad en Redes Sociales",
  description:
    "Gestionamos tus campañas de publicidad en Facebook, Instagram y TikTok. Resultados medibles, pagos seguros por PayPal.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#003087",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${quicksand.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-[color:var(--color-cream)] font-sans overflow-x-hidden" suppressHydrationWarning>
        {children}
        <WhatsAppButton variant="floating" />
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Replace `src/app/page.tsx` (Header + Hero + Footer only — Task 2 adds the rest)**

```typescript
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
```

- [ ] **Step 8: Remove unused dependencies from `package.json`**

Find:
```json
  "dependencies": {
    "@supabase/ssr": "^0.10.0",
    "@supabase/supabase-js": "^2.101.1",
    "clsx": "^2.1.1",
    "jsonwebtoken": "^9.0.3",
    "lucide-react": "^1.7.0",
    "next": "16.2.2",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "exceljs": "^4.4.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^20.19.39",
```

Replace with:
```json
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^1.7.0",
    "next": "16.2.2",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20.19.39",
```

- [ ] **Step 9: Regenerate the lockfile and verify the build succeeds**

```bash
ssh -o ControlPath=/tmp/ssh-schn-%r@%h root@135.181.37.72 'cd /root/deCompritasCR && npm install && npm run build 2>&1 | tail -40'
```

Expected: `npm install` completes, then the build output ends with a successful Next.js
build summary (a route table showing `/` as a static/prerendered route) and no `Error`
or `Failed to compile` lines. If it fails on a missing import, find the dangling
reference (likely a leftover import of something deleted in Step 1) and remove it.

- [ ] **Step 10: Commit**

```bash
ssh -o ControlPath=/tmp/ssh-schn-%r@%h root@135.181.37.72 'cd /root/deCompritasCR && git add -- src/app/api src/app/admin src/lib/supabase src/lib/telegram.ts src/lib/weekly-report.ts src/lib/demo-store.ts src/types/database.types.ts src/types/database.types.ts.bak src/components/product src/components/cart src/components/checkout src/components/DynamicTitle.tsx src/components/index.ts src/context/CartContext.tsx src/context/StoreContext.tsx supabase public/uploads public/logo.png public/manifest.json "Logo de Compritas ONLINE SHOP.png" .env.build .env.build.indira src/lib/utils.ts src/app/globals.css src/app/layout.tsx src/app/page.tsx package.json package-lock.json src/components/WhatsAppButton.tsx src/components/TrustBadges.tsx && git commit -m "feat: tear down e-commerce store, land ad-agency landing page foundation

Removes Supabase, cart/checkout/admin, and all product/order API routes.
Replaces the storefront with a single landing-page route (Header, Hero,
Footer for now — remaining sections land in the next commit), a
WhatsAppButton component (contact CTA), and a TrustBadges component
(PayPal/security trust messaging, branding only — no real payment
processing).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"'
```

---

### Task 2: Add the remaining landing page sections

**Files:**
- Modify: `src/app/page.tsx:1-` (insert `Services`, `HowItWorks`, `WhyUs`, `FinalCTA`
  sections between `Hero` and `Footer`)

**Interfaces:**
- Consumes: `WhatsAppButton`, `TrustBadges` (from Task 1, unchanged signatures).
- No new interfaces produced — this task only adds JSX content to the existing
  `Page()` composition.

- [ ] **Step 1: Replace the full `src/app/page.tsx` with all sections**

```typescript
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
```

- [ ] **Step 2: Verify the build still succeeds**

```bash
ssh -o ControlPath=/tmp/ssh-schn-%r@%h root@135.181.37.72 'cd /root/deCompritasCR && npm run build 2>&1 | tail -40'
```

Expected: same successful build summary as Task 1's Step 9, no errors.

- [ ] **Step 3: Local smoke check — every section renders**

```bash
ssh -o ControlPath=/tmp/ssh-schn-%r@%h root@135.181.37.72 'cd /root/deCompritasCR && (npm run start -p 3099 &) && sleep 4 && curl -s http://localhost:3099/ | grep -o "Qué hacemos por tu negocio\|Cómo funciona\|Por qué elegirnos\|listo para hacer crecer" ; pkill -f "next start -p 3099" 2>/dev/null || pkill -f "PORT=3099" 2>/dev/null; fuser -k 3099/tcp 2>/dev/null; true'
```

Expected: the four section headings (case-sensitive text you grepped for) each appear
at least once in the output, confirming all sections rendered server-side.

- [ ] **Step 4: Commit**

```bash
ssh -o ControlPath=/tmp/ssh-schn-%r@%h root@135.181.37.72 'cd /root/deCompritasCR && git add src/app/page.tsx && git commit -m "feat: add Services, How It Works, Why Us, and final CTA sections

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"'
```

---

### Task 3: Clean up deployment config, remove the unused deploy scaffold, deploy, and verify live

**Files:**
- Modify: `docker-compose.yml` (repo root — remove the now-unused Supabase/Telegram/
  JWT/cron environment variable references; this is the file that actually drives the
  live `decompritascr-app-1` container, service name `app`)
- Delete: `deploy/` (entire directory — an unused alternate deployment scaffold; the
  live container is built from the root `Dockerfile` + root `docker-compose.yml`, not
  from anything in `deploy/`)
- Modify: `README.md`
- Modify: `CLAUDE.md`

**Interfaces:** None — this task only touches deployment/docs, no application code.

- [ ] **Step 1: Confirm which compose project is actually live (sanity check before touching anything)**

```bash
ssh -o ControlPath=/tmp/ssh-schn-%r@%h root@135.181.37.72 'docker inspect decompritascr-app-1 --format "{{index .Config.Labels \"com.docker.compose.project.config_files\"}}"'
```

Expected: `/root/deCompritasCR/docker-compose.yml` (the root-level file, confirming
`deploy/` is safe to remove).

- [ ] **Step 2: Simplify the root `docker-compose.yml`**

Find:
```yaml
services:
  app:
    build: .
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - CRON_SECRET=${CRON_SECRET}
    volumes:
      - uploads_data:/app/public/uploads
    restart: unless-stopped
```

Replace with:
```yaml
services:
  app:
    build: .
    restart: unless-stopped
```

Find:
```yaml
volumes:
  uploads_data:
    driver: local

networks:
  deploy_web:
    external: true
```

Replace with:
```yaml
networks:
  deploy_web:
    external: true
```

(The Traefik labels block below `app:` is unchanged — leave it exactly as-is.)

- [ ] **Step 3: Remove the unused `deploy/` scaffold**

```bash
ssh -o ControlPath=/tmp/ssh-schn-%r@%h root@135.181.37.72 'cd /root/deCompritasCR && rm -rf deploy && echo DEPLOY_DIR_REMOVED'
```

Expected: `DEPLOY_DIR_REMOVED`.

- [ ] **Step 4: Update `README.md`**

```markdown
# DeCompritas — Publicidad en Redes Sociales

Landing page para una agencia de gestión de publicidad en redes sociales
(Facebook, Instagram, TikTok). Página estática de una sola vista, sin backend,
sin base de datos. El único canal de contacto es WhatsApp.

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS v4, `lucide-react`.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Build de producción

```bash
npm run build
npm start
```

## Despliegue

Docker, mismo patrón que el resto del VPS: `docker-compose.yml` (raíz de este
repo) construye la imagen con el `Dockerfile` (raíz) y la expone vía Traefik en
`decompritascr.com` / `www.decompritascr.com`.

```bash
docker compose build
docker compose up -d
```

## Antes de publicar

- Reemplazar el número de WhatsApp placeholder (`506XXXXXXXX`) en
  `src/components/WhatsAppButton.tsx` por el número real del negocio.

## Licencia

MIT License
```

- [ ] **Step 5: Update `CLAUDE.md`**

```markdown
# DeCompritas — Publicidad en Redes Sociales

Landing page de una sola vista para una agencia de gestión de publicidad en
redes sociales, construida con Next.js 16, TypeScript y Tailwind CSS v4. Sin
backend, sin base de datos. Contacto único: WhatsApp (`src/components/WhatsAppButton.tsx`
— número placeholder, reemplazar antes de publicar). PayPal se muestra solo como
mensaje de confianza (`src/components/TrustBadges.tsx`) — no hay checkout ni
procesamiento de pagos real.
```

- [ ] **Step 6: Build the Docker image and deploy**

```bash
ssh -o ControlPath=/tmp/ssh-schn-%r@%h root@135.181.37.72 'cd /root/deCompritasCR && docker compose build 2>&1 | tail -30 && docker compose up -d 2>&1 | tail -5'
```

Expected: the build completes with no `ERROR` lines, and the final lines show the
`decompritascr-app-1` (or `app`, depending on compose project naming) container
started/recreated.

- [ ] **Step 7: Verify the container is healthy and serving the new page**

```bash
ssh -o ControlPath=/tmp/ssh-schn-%r@%h root@135.181.37.72 'sleep 3 && docker ps --filter name=decompritascr --format "{{.Names}} {{.Status}}" && curl -s http://localhost:3000 -H "Host: decompritascr.com" | grep -o "Haz crecer tu negocio con campañas que sí funcionan"'
```

Expected: the container shows `Up` status, and the hero heading text appears in the
curl output — confirms the new page is being served, not the old store.

- [ ] **Step 8: Live browser verification**

Using the Chrome browser tools, navigate to `https://decompritascr.com` and confirm:
- The old product catalog/cart/checkout UI is gone; the new landing page loads.
- Hero, Services, Cómo Funciona, Por Qué Elegirnos, CTA final, and Footer sections are
  all present.
- The floating WhatsApp button appears in the bottom-right corner on both desktop and
  a narrow mobile viewport.
- "Aceptamos PayPal" trust badges are visible near the hero and in the footer.
- No broken images (the deleted `/logo.png`/`/manifest.json` should not be referenced
  anywhere — check the browser console for 404s).
- `/admin` and any old `/api/*` route return a 404 (confirming the old backend is
  gone), e.g. `https://decompritascr.com/admin`.

- [ ] **Step 9: Commit**

```bash
ssh -o ControlPath=/tmp/ssh-schn-%r@%h root@135.181.37.72 'cd /root/deCompritasCR && git add docker-compose.yml README.md CLAUDE.md && git rm -r --cached deploy > /dev/null 2>&1; git add -u && git commit -m "chore: remove unused deploy/ scaffold, simplify docker-compose env vars, update docs

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"'
```
