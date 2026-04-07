#!/bin/bash

# ===========================================
# DEPLOY SCRIPT - Initial Server Setup
# ===========================================
# Run this once on a fresh Ubuntu server

set -e

echo "================================================"
echo "INITIAL SERVER SETUP"
echo "================================================"

# Update system
echo "Updating system..."
apt update && apt upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo "Installing Docker Compose..."
    apt install -y docker-compose-plugin
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p ./letsencrypt
mkdir -p ./stores

# Set permissions
chmod 600 ./letsencrypt 2>/dev/null || true

echo ""
echo "================================================"
echo "SERVER SETUP COMPLETE!"
echo "================================================"
echo ""
echo "NEXT STEPS:"
echo "1. Edit ./stores/decompritas/.env with your credentials"
echo "2. Add ACME_EMAIL to docker-compose.yml or create .env file"
echo "3. Run: docker compose up -d"
echo ""
echo "To add more stores:"
echo "  ./add-store.sh storename domain.com"
echo ""
echo "Useful commands:"
echo "  docker compose ps              # View running containers"
echo "  docker compose logs -f traefik # View Traefik logs"
echo "  docker compose logs -f decompritas # View store logs"
echo "  docker compose restart NAME    # Restart a container"
echo "  docker compose down            # Stop all containers"