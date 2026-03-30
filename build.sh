#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Initializing Database and Default Users (if needed)..."
python -c "from app import init_db; init_db()"
echo "Build complete."
