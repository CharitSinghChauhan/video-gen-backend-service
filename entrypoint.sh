#!/bin/bash
set -e

# Install wal2json if not already installed
if ! dpkg -l | grep -q postgresql-17-wal2json; then
  apt-get update
  apt-get install -y postgresql-17-wal2json
fi

# Execute the original entrypoint
exec docker-entrypoint.sh "$@"