#!/bin/bash

# ===========================================
# STORE MANAGEMENT - Build & Deploy
# ===========================================

STORE_NAME=${1:-"all"}

build_store() {
    local name=$1
    echo "Building $name..."
    docker compose build $name
    docker compose up -d $name
}

restart_store() {
    local name=$1
    echo "Restarting $name..."
    docker compose restart $name
}

logs_store() {
    local name=$1
    docker compose logs -f $name
}

update_all() {
    echo "Pulling latest code..."
    cd ..
    git pull origin main
    cd deploy

    echo "Rebuilding all stores..."
    docker compose down
    docker compose build
    docker compose up -d
}

case "$2" in
    build)
        if [ "$STORE_NAME" = "all" ]; then
            docker compose build
            docker compose up -d
        else
            build_store $STORE_NAME
        fi
        ;;
    restart)
        if [ "$STORE_NAME" = "all" ]; then
            docker compose restart
        else
            restart_store $STORE_NAME
        fi
        ;;
    logs)
        if [ "$STORE_NAME" = "all" ]; then
            docker compose logs -f
        else
            logs_store $STORE_NAME
        fi
        ;;
    update)
        update_all
        ;;
    status)
        docker compose ps
        ;;
    stop)
        docker compose stop $STORE_NAME
        ;;
    start)
        docker compose start $STORE_NAME
        ;;
    *)
        echo "Usage: $0 <store_name|all> <command>"
        echo ""
        echo "Commands:"
        echo "  build   - Build and start a store"
        echo "  restart - Restart a store"
        echo "  logs    - View logs"
        echo "  update  - Pull code and rebuild all stores"
        echo "  status  - Show running containers"
        echo "  stop    - Stop a store"
        echo "  start   - Start a store"
        echo ""
        echo "Examples:"
        echo "  $0 decompritas build"
        echo "  $0 decompritas logs"
        echo "  $0 all status"
        ;;
esac