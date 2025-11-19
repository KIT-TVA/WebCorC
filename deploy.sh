#!/bin/bash
set -e
log() {
    echo "[$(date +'%H:%M:%S')] $1"
}
log "=================================================="
log "STARTING DEPLOYMENT"
log "=================================================="

# --- Step 1: Docker Teardown ---
log "Stopping currently running containers..."
docker compose down --remove-orphans

log "Cleaning up disk space (pruning dangling images)..."
docker image prune -f || true

# --- Step 2: Git Operations ---
log "--------------------------------------------------"
log "UPDATING SOURCE CODE"
log "--------------------------------------------------"

if [[ $(git status --porcelain) ]]; then
  log "Local changes detected. Stashing..."
  git stash
  HAS_STASH=1
else
  log "No local changes to stash."
  HAS_STASH=0
fi

log "Pulling latest changes from git..."
git pull

if [ $HAS_STASH -eq 1 ]; then
  log "Re-applying stashed changes..."
  git stash pop
fi

# --- Step 3: Build and Launch ---
log "--------------------------------------------------"
log "BUILDING AND LAUNCHING"
log "--------------------------------------------------"

log "Building new images and starting containers..."
docker compose up -d

# --- Step 4: Final Status ---
log "--------------------------------------------------"
log "DEPLOYMENT STATUS"
log "--------------------------------------------------"
log "Deployment successful. Application is up and running."
echo ""
