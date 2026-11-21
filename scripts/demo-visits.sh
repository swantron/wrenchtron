#!/usr/bin/env bash
# Who used the fleet demo, and what they looked at. Reads Firebase Hosting's request
# log, so the Cloud Logging integration must be on (Firebase console → Project
# settings → Integrations → Cloud Logging).
#
#   scripts/demo-visits.sh        # last 7 days
#   scripts/demo-visits.sh 30d    # last 30 days
set -euo pipefail

gcloud logging read \
  'resource.type="firebase_domain" AND httpRequest.requestUrl:"/hit.txt"' \
  --project wrenchtron-db057 \
  --freshness "${1:-7d}" \
  --order asc \
  --format json |
  python3 -c '
import json, sys
from datetime import datetime
from urllib.parse import urlparse, parse_qs

rows = json.load(sys.stdin)
if not rows:
    print("No demo visits in this window.")
for row in rows:
    req = row.get("httpRequest", {})
    q = {k: v[0] for k, v in parse_qs(urlparse(req.get("requestUrl", "")).query).items()}
    when = datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00")).astimezone()
    ua = req.get("userAgent", "")
    device = "iPhone" if "iPhone" in ua else "Android" if "Android" in ua else "Mac" if "Macintosh" in ua else "Windows" if "Windows" in ua else ua[:20]
    who, event, detail, ip = q.get("r", "-"), q.get("e", ""), q.get("d", ""), req.get("remoteIp", "")
    print(f"{when:%a %b %d %I:%M %p}  {who:<10} {event:<10} {detail:<14} {device:<8} {ip}")
'
