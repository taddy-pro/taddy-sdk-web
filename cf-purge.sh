#!/bin/bash
export $(cat .env | xargs) && \
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" -H "Authorization: Bearer ${CF_CLEAR_CACHE_TOKEN}" -H "Content-Type: application/json" --data '{"hosts":["sdk.taddy.pro"]}' | jq