# DeCompritas — Landing page de agencia de publicidad en redes sociales — Diseño

**Fecha:** 2026-07-24
**Estado:** Aprobado por Erick

## Objetivo

Reconstruir por completo `decompritascr.com` (hoy una tienda de comercio electrónico
mobile-first con Supabase, carrito, checkout, panel admin y notificaciones por
Telegram) y convertirla en una landing page de una sola vista para una agencia de
gestión de publicidad en redes sociales (Facebook/Instagram/TikTok, etc. para
clientes de terceros — no venta de espacio en las redes propias de DeCompritas).

## Decisiones tomadas

- **Modelo de negocio:** agencia que gestiona campañas publicitarias para otros
  negocios (no reventa de audiencia propia).
- **PayPal:** solo branding/confianza (íconos y mensajes "Aceptamos pagos por
  PayPal" repetidos en la página) — **sin checkout funcional**, sin procesamiento
  real de pagos, sin integración con la API de PayPal.
- **Contacto:** un solo canal — botón/CTA de WhatsApp (fijo en el header y flotante
  en toda la página). Sin formulario de contacto, sin backend.
- **Marca:** se mantiene el nombre "DeCompritas" con un wordmark de texto nuevo
  (el logo actual de tienda no aplica al nuevo giro de negocio).
- **Precios:** no se muestran públicamente — todo el flujo apunta a "cotización
  personalizada" vía WhatsApp.
- **Contenido:** copy genérico de agencia de publicidad (placeholder, editable
  después). **Nunca se inventan testimonios, logos de clientes o resultados
  reales** — esas secciones se omiten hasta que haya contenido real que agregar.
- **Número de WhatsApp:** placeholder obvio `506XXXXXXXX` con comentario
  `{/* REEMPLAZAR antes de publicar */}` junto a cada uso — el sitio no debe
  publicarse con este placeholder activo.

## Arquitectura

Se mantiene el mismo stack de despliegue ya en producción para este dominio:
Next.js 16 + Tailwind, mismo `Dockerfile.production`, mismo
`deploy/docker-compose.yml`, mismas labels de Traefik (`decompritascr.com` /
`www.decompritascr.com`, redirect HTTP→HTTPS, certresolver `letsencrypt`) — **no se
toca la infraestructura de despliegue**, solo el código de la aplicación.

Se elimina por completo:
- `@supabase/ssr`, `@supabase/supabase-js` y todo `src/lib/supabase/`
- `src/app/admin/` (panel de administración)
- `src/app/api/*` (products, orders, cart, stock, week-cycles, shipping,
  payment-methods, reports, cron, uploads, categories, settings, store-settings)
- `src/components/product/`, `src/components/cart/`, `src/components/checkout/`
- `src/context/` (carrito), `supabase/` (schema + migrations)
- Dependencias ya no usadas del `package.json` (`@supabase/*`, `jsonwebtoken`,
  `exceljs`) y sus variables de entorno relacionadas (Supabase, Telegram, JWT,
  cron secret)

Se conserva: Next.js App Router, Tailwind CSS, `next.config.ts`, `tsconfig.json`,
el patrón de Dockerfile multi-stage existente, y el pipeline de deploy
(`deploy/deploy.sh`, `deploy/manage.sh`).

Resultado: una sola página (`src/app/page.tsx`), sin rutas API, sin variables de
entorno de backend, sin base de datos.

## Estructura de la página (una sola vista, scroll largo, mobile-first)

1. **Header fijo** — wordmark "DeCompritas" + botón WhatsApp visible siempre
2. **Hero** — titular + subtítulo sobre gestión de publicidad en redes sociales,
   CTA principal a WhatsApp
3. **Barra de confianza** — íconos "Aceptamos pagos por PayPal" + mensajes de
   seguridad, repetida en el hero y en el footer
4. **Servicios** — 3-4 tarjetas (gestión de campañas, diseño de creatividades,
   segmentación de audiencia, reportes de resultados) — copy placeholder
5. **Cómo funciona** — 3-4 pasos (Contactanos → Definimos tu estrategia → Lanzamos
   la campaña → Ves resultados)
6. **Por qué elegirnos** — diferenciadores genéricos (placeholder)
7. **CTA final** — botón de WhatsApp repetido
8. **Botón flotante de WhatsApp** — visible en todo momento, mobile-first
9. **Footer** — contacto, íconos de PayPal otra vez, copyright

Sin sección de testimonios/clientes (evitar contenido fabricado).

## Identidad visual

Wordmark de texto para "DeCompritas" (no el logo de tienda existente). Paleta
cercana al azul/verde de PayPal para reforzar la asociación de confianza en el
pago, combinada con un acento de marca propio. Diseño mobile-first, consistente
con el enfoque del sitio anterior.

## Verificación

1. Build local del contenedor (`docker compose build` sobre el
   `Dockerfile.production` existente) — debe compilar sin errores tras eliminar
   Supabase y las rutas API.
2. Deploy con el mismo patrón usado en esta sesión para otros proyectos del VPS.
3. Revisión visual en Chrome contra `decompritascr.com`, en desktop y en un
   viewport angosto (mobile), confirmando: CTAs de WhatsApp presentes y con el
   placeholder claramente marcado, branding de PayPal visible en al menos 2
   puntos de la página, ninguna ruta `/admin` ni `/api/*` de la tienda vieja
   accesible.

## Fuera de alcance

- Checkout o procesamiento real de pagos (PayPal es solo branding).
- Formulario de contacto o cualquier backend/base de datos.
- Precios públicos o paquetes con costo visible.
- Testimonios, logos de clientes o casos de éxito (no hay contenido real
  disponible; se agregan en una iteración futura cuando exista).
- Número de WhatsApp real (queda como placeholder a reemplazar por el equipo).
