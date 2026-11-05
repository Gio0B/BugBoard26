#!/bin/sh
set -eu

api_base_url="${API_BASE_URL:-http://localhost:3000/api}"

case "$api_base_url" in
  http://*|https://*|/*) ;;
  *)
    printf '%s\n' 'API_BASE_URL must be an absolute HTTP(S) URL or a root-relative path.' >&2
    exit 1
    ;;
esac

escaped_api_base_url=$(printf '%s' "$api_base_url" | sed 's/\\/\\\\/g; s/"/\\"/g')

printf 'window.__BUGBOARD_CONFIG__ = Object.freeze({ API_BASE_URL: "%s" });\n' "$escaped_api_base_url" \
  > /usr/share/nginx/html/config.js
