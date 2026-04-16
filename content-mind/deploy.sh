#!/usr/bin/env bash
# deploy.sh — Deploy ContentMind to the Contabo VM
# Usage: bash deploy.sh
set -e

VM="root@75.119.138.179"
REMOTE="/root/content-mind"

echo "==> Copying ContentMind files to VM..."
scp -r \
    content_mind.py \
    config.py \
    game_registry.py \
    trend_scanner.py \
    content_generator.py \
    cmmv_publisher.py \
    requirements.txt \
    .env.example \
    content-mind.service \
    content-mind.timer \
    "${VM}:${REMOTE}/"

echo "==> Setting up Python venv and dependencies..."
ssh "${VM}" bash -s << 'REMOTE_SETUP'
set -e
cd /root/content-mind

# Create venv if it doesn't exist
if [ ! -d venv ]; then
    python3 -m venv venv
    echo "Created venv"
fi

# Install dependencies
venv/bin/pip install --quiet --upgrade pip
venv/bin/pip install --quiet -r requirements.txt
echo "Dependencies installed"

# Create .env from .env.example if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example — EDIT IT before the service starts!"
fi
REMOTE_SETUP

echo "==> Installing systemd units..."
ssh "${VM}" bash -s << 'SYSTEMD_SETUP'
set -e
cp /root/content-mind/content-mind.service /etc/systemd/system/
cp /root/content-mind/content-mind.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable content-mind.timer
echo "Systemd units installed and timer enabled"
echo ""
echo "IMPORTANT: Edit /root/content-mind/.env with your admin credentials first!"
echo "Then start the timer:  systemctl start content-mind.timer"
echo "Test a single run:     cd /root/content-mind && venv/bin/python content_mind.py --game valorant"
SYSTEMD_SETUP

echo ""
echo "==> Deploy complete!"
echo "Next steps:"
echo "  1. SSH into VM:  ssh root@75.119.138.179"
echo "  2. Edit .env:    nano /root/content-mind/.env"
echo "  3. Test run:     cd /root/content-mind && venv/bin/python content_mind.py --game valorant"
echo "  4. Enable timer: systemctl start content-mind.timer"
