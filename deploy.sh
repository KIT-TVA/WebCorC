#!/bin/bash
echo "Starting deployment..."
echo "Stopping old container..."
docker compose down
echo "Fetching new git changes..."
git stash
git pull
git stash pop 
echo "Starting new container..."
docker compose up --build -d
