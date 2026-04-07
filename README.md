# DeCompritas Store

Una aplicación web móvil-first para catálogo de productos con notificaciones de pedidos vía Telegram.

## Características

- Catálogo de productos responsivo (mobile-first)
- Carrito de compras con persistencia local
- Flujo de checkout simplificado
- Notificaciones de pedidos vía Telegram
- Panel de administración seguro
- CRUD de productos
- Historial de pedidos
- Sistema de pre-pedidos (productos agotados)
- Ciclos semanales de pedidos
- Reportes automáticos semanales vía Telegram

## Instalación

### 1. Clonar e instalar dependencias

```bash
cd decompritas-store
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus credenciales:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_de_supabase

# Telegram
TELEGRAM_BOT_TOKEN=tu_token_del_bot
TELEGRAM_CHAT_ID=tu_chat_id

# Admin
ADMIN_PASSWORD=tu_contraseña_segura
JWT_SECRET=tu_secreto_jwt

# Cron Job (para reportes semanales)
CRON_SECRET=tu_secreto_cron

# Site
SITE_URL=https://tu-dominio.com
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

### 3. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve a SQL Editor y ejecuta el contenido de `supabase/schema.sql`
3. Obtén tus credenciales en Settings > API

### 4. Iniciar el servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Acceso Admin

1. Ve a `/admin/login`
2. Ingresa la contraseña configurada en `ADMIN_PASSWORD`
3. Gestiona productos, pedidos y configuración

## Desarrollo

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar en producción
npm start

# Linting
npm run lint
```

## Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

### Docker

```bash
docker build -t decompritas-store .
docker run -p 3000:3000 --env-file .env decompritas-store
```

## Licencia

MIT License