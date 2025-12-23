#!/bin/sh
set -e

PORT="${PORT:-3000}"
HOST="${HOSTNAME:-0.0.0.0}"

exec ./node_modules/.bin/next start -p "$PORT" -H "$HOST"
