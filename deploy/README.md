# Multi-Store Deployment Architecture

Production-ready Docker setup for hosting multiple stores on a single server.

## Folder Structure

```
deploy/
├── docker-compose.yml          # Development compose (uses npm run build inside)
├── docker-compose.prod.yml    # Production compose (uses pre-built images)
├── deploy.sh                  # Initial server setup script
├── add-store.sh               # Script to add new stores
├── letsencrypt/               # SSL certificates (auto-generated)
├── logs/                      # Traefik access logs
└── stores/
    ├── decompritas/
    │   ├── .env               # Store-specific environment variables
    │   └── public/
    │       └── uploads/       # Uploaded files (persistent)
    ├── tienda2/
    │   ├── .env
    │   └── public/uploads/
    └── tienda3/
        ├── .env
        └── public/uploads/
```

## Quick Start

### 1. Initial Server Setup (Run once)

```bash
# SSH into your Hetzner server
ssh root@your-server-ip

# Clone or upload your project
git clone https://github.com/eralvarezra/deCompritasCR.git
cd DeCompritas/deploy

# Run the setup script
chmod +x deploy.sh add-store.sh
./deploy.sh
```

### 2. Configure Environment

```bash
# Edit the .env file for your main store
nano stores/decompritas/.env
```

Fill in your values:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `JWT_SECRET` - Generate with: `openssl rand -hex 32`
- `ADMIN_PASSWORD` - Your admin panel password
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `TELEGRAM_CHAT_ID` - Telegram chat ID

### 3. Set ACME Email

Create a `.env` file in the deploy directory:

```bash
echo "ACME_EMAIL=admin@decompritas.com" > .env
```

### 4. Start Services

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f traefik
docker compose logs -f decompritas
```

## Adding New Stores

### Method 1: Using the Script

```bash
./add-store.sh tienda1 tienda1.com
```

Then:
1. Edit `./stores/tienda1/.env` with your Supabase credentials
2. Add the store configuration to `docker-compose.yml`
3. Run `docker compose up -d tienda1`

### Method 2: Manual Setup

1. Create store directory:
```bash
mkdir -p stores/tienda1/public/uploads
```

2. Create `.env` file:
```bash
cp stores/decompritas/.env stores/tienda1/.env
nano stores/tienda1/.env
```

3. Add to `docker-compose.yml`:

```yaml
  tienda1:
    image: node:20-alpine
    container_name: tienda1
    restart: always
    working_dir: /app
    env_file:
      - ./stores/tienda1/.env
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ../:/app:ro
      - ./stores/tienda1/public/uploads:/app/public/uploads
    command: sh -c "npm ci --only=production && npm run build && npm start"
    networks:
      - web
    depends_on:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.tienda1.rule=Host(`tienda1.com`,`www.tienda1.com`)"
      - "traefik.http.routers.tienda1.entrypoints=websecure"
      - "traefik.http.routers.tienda1.tls.certresolver=letsencrypt"
      - "traefik.http.services.tienda1.loadbalancer.server.port=3000"
```

4. Start the store:
```bash
docker compose up -d tienda1
```

## DNS Configuration

For each store, point your domain to the server:

```
# Domain A Records
tienda1.com        A        YOUR_SERVER_IP
www.tienda1.com    CNAME    tienda1.com

tienda2.com        A        YOUR_SERVER_IP
www.tienda2.com    CNAME    tienda2.com
```

## SSL Certificates

Traefik automatically handles SSL via Let's Encrypt:
- Certificates are stored in `./letsencrypt/acme.json`
- Auto-renewal is handled automatically
- No manual configuration needed

## Useful Commands

```bash
# View running containers
docker compose ps

# View logs for a specific store
docker compose logs -f decompritas

# Restart a specific store
docker compose restart decompritas

# Rebuild and restart a store (after code changes)
docker compose up -d --build decompritas

# Stop all services
docker compose down

# Update a store's code
git pull origin main
docker compose up -d --build decompritas

# Check Traefik routes
docker compose exec traefik traefik config show
```

## Performance Tips

### 1. Resource Limits

Add resource limits to prevent one store from consuming all memory:

```yaml
  decompritas:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 2. Use Pre-built Images (Production)

For production, build images once and push to a registry:

```bash
# Build image
docker build -f Dockerfile.production -t decompritas:v1.0.0 .

# Push to registry
docker push your-registry/decompritas:v1.0.0
```

Then use in `docker-compose.prod.yml`:
```yaml
image: your-registry/decompritas:v1.0.0
```

### 3. Enable Caching

Add to your Next.js config for static assets:

```javascript
// next.config.ts
const nextConfig = {
  // Enable static optimization
  output: 'standalone',
}
```

### 4. Monitor Resources

```bash
# Check container resource usage
docker stats

# Check disk usage
df -h

# Check memory
free -h
```

## Security Best Practices

1. **Firewall**: Only allow ports 80, 443, and 22 (SSH)
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

2. **Secure .env files**:
```bash
chmod 600 stores/*/.env
```

3. **Regular updates**:
```bash
# Update system packages
apt update && apt upgrade -y

# Update Docker images
docker compose pull
docker compose up -d
```

## Troubleshooting

### Container won't start
```bash
docker compose logs decompritas
```

### SSL not working
1. Check DNS is pointing to your server
2. Check Traefik logs: `docker compose logs traefik`
3. Verify email in `.env` is valid

### Port conflicts
```bash
# Check what's using ports
netstat -tlnp | grep ':80\|:443'
```

### Memory issues
```bash
# Check available memory
free -h

# Add swap if needed
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```