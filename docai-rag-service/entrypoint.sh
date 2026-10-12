#!/bin/sh
set -e

# Ensure ChromaDB persistent storage directory exists and has correct permissions
mkdir -p /app/chroma_store
chown -R docai:docai /app/chroma_store

# If running as root, drop privileges to docai user
if [ "$(id -u)" = '0' ]; then
    exec gosu docai "$@"
fi

exec "$@"
