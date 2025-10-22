#!/bin/sh

# Generate runtime environment configuration
cat <<EOF > /usr/share/nginx/html/env-config.js
window._env_ = {
  VITE_BACKEND_URL: "${VITE_BACKEND_URL:-http://localhost:8000}",
  VITE_LIVEKIT_URL: "${VITE_LIVEKIT_URL:-ws://localhost:7880}"
};
EOF

echo "Runtime environment configuration generated:"
cat /usr/share/nginx/html/env-config.js

# Start nginx
exec "$@"
