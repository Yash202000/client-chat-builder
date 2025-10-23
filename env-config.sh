#!/bin/sh

# Generate runtime environment configuration
# IMPORTANT: Environment variables must be set via docker run -e or docker-compose.yml
# No defaults are provided here to ensure explicit configuration

cat <<EOF > /usr/share/nginx/html/env-config.js
window._env_ = {
  VITE_BACKEND_URL: "${VITE_BACKEND_URL}",
  VITE_LIVEKIT_URL: "${VITE_LIVEKIT_URL}",
  VITE_VOICE_ENGINE_URL: "${VITE_VOICE_ENGINE_URL:-${VITE_BACKEND_URL}}"
};
EOF

echo "Runtime environment configuration generated:"
cat /usr/share/nginx/html/env-config.js

# Validate required environment variables
if [ -z "$VITE_BACKEND_URL" ]; then
  echo "ERROR: VITE_BACKEND_URL is required but not set!"
  exit 1
fi

if [ -z "$VITE_LIVEKIT_URL" ]; then
  echo "ERROR: VITE_LIVEKIT_URL is required but not set!"
  exit 1
fi

# Start nginx
exec "$@"
