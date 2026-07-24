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
