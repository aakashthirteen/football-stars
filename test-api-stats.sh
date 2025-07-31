#!/bin/bash

# Test the API directly to see if stats are being returned
echo "🔍 Testing team stats from Railway API..."

# First, let's get all teams
echo -e "\n📋 Fetching all teams..."
curl -s https://football-stars-flutter-production.up.railway.app/api/teams/all \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.'

# Test a specific team
TEAM_ID="a8b4bf80-3b67-4877-ba2d-06bbbd2e7e74"
echo -e "\n📊 Fetching specific team: $TEAM_ID"
curl -s https://football-stars-flutter-production.up.railway.app/api/teams/$TEAM_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.'