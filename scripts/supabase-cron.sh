#!/bin/sh
# Supabase database ping cron job
# Keeps the database active by making a simple query once a week

# Get the application URL from environment or use localhost
APP_URL="${SITE_URL:-http://localhost:3000}"

# Make request to the cron endpoint with authentication
echo "[$(date)] Starting Supabase cron job..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${APP_URL}/api/supabase")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "[$(date)] ✅ Supabase cron job completed successfully"
    echo "Response: $BODY"
else
    echo "[$(date)] ❌ Supabase cron job failed with status $HTTP_CODE"
    echo "Response: $BODY"
fi
