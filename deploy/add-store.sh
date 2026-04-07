#!/bin/bash

# ===========================================
# STORE MANAGEMENT SCRIPT
# ===========================================
# Usage: ./add-store.sh <store_name> <domain>

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./add-store.sh <store_name> <domain>"
    echo "Example: ./add-store.sh tienda1 tienda1.com"
    exit 1
fi

STORE_NAME=$1
DOMAIN=$2
STORE_DIR="./stores/$STORE_NAME"

# Convert store name to valid Docker container name
CONTAINER_NAME=$(echo "$STORE_NAME" | tr '[:upper:]' '[:lower]' | tr '-' '_')

echo "================================================"
echo "Adding new store: $STORE_NAME"
echo "Domain: $DOMAIN"
echo "Container: $CONTAINER_NAME"
echo "================================================"

# Create store directory structure
mkdir -p "$STORE_DIR/public/uploads"

# Create .env file from template
if [ ! -f "$STORE_DIR/.env" ]; then
    echo "Creating .env file..."
    cat > "$STORE_DIR/.env" << EOF
# ===========================================
# ENV CONFIGURATION FOR $STORE_NAME
# ===========================================

# Database (Supabase - use a NEW project for each store!)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_PASSWORD=your-admin-password

# Telegram Notifications
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

# Site Configuration
SITE_URL=https://$DOMAIN
NEXT_PUBLIC_SITE_URL=https://$DOMAIN
MAIN_DOMAIN=$DOMAIN

# Cron Job Security
CRON_SECRET=$(openssl rand -hex 16)
EOF
    echo "Created: $STORE_DIR/.env"
    echo "⚠️  EDIT THIS FILE WITH YOUR ACTUAL VALUES!"
fi

echo ""
echo "✅ Store directory created: $STORE_DIR"
echo ""
echo "NEXT STEPS:"
echo "1. Edit $STORE_DIR/.env with your Supabase credentials"
echo "2. Add the store to docker-compose.yml:"
echo ""
echo "   $STORE_NAME:"
echo "     image: node:20-alpine"
echo "     container_name: $CONTAINER_NAME"
echo "     restart: always"
echo "     working_dir: /app"
echo "     env_file:"
echo "       - $STORE_DIR/.env"
echo "     environment:"
echo "       - NODE_ENV=production"
echo "       - PORT=3000"
echo "     volumes:"
echo "       - ../:/app:ro"
echo "       - $STORE_DIR/public/uploads:/app/public/uploads"
echo "     command: sh -c \"npm ci --only=production && npm run build && npm start\""
echo "     networks:"
echo "       - web"
echo "     labels:"
echo "       - \"traefik.enable=true\""
echo "       - \"traefik.http.routers.$CONTAINER_NAME.rule=Host(\`$DOMAIN\`)\""
echo "       - \"traefik.http.routers.$CONTAINER_NAME.entrypoints=websecure\""
echo "       - \"traefik.http.routers.$CONTAINER_NAME.tls.certresolver=letsencrypt\""
echo "       - \"traefik.http.services.$CONTAINER_NAME.loadbalancer.server.port=3000\""
echo ""
echo "3. Run: docker compose up -d $CONTAINER_NAME"