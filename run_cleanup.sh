#!/bin/bash

echo "🧹 Cleaning old matches from database..."
echo ""

# Call the cleanup endpoint
response=$(curl -s -X GET "https://football-stars-production.up.railway.app/api/clean-old-matches")

# Check if successful
if echo "$response" | grep -q '"success":true'; then
  echo "✅ Cleanup successful!"
  echo "$response" | jq '.'
else
  echo "❌ Cleanup failed!"
  echo "$response"
fi

echo ""
echo "🎯 Done!"