#!/bin/sh
# usage: wait.sh <app> <port> — waits for the server, then prints a resolve error if the bundle fails
for i in $(seq 1 60); do curl -s -o /dev/null -w "%{http_code}" http://localhost:$2 2>/dev/null | grep -q 200 && break; sleep 3; done
U="http://localhost:$2/apps/$1/index.ts.bundle?platform=web&dev=false&hot=false&minify=true&lazy=true&transform.engine=hermes&transform.routerRoot=app&unstable_transformProfile=hermes-stable"
curl -s "$U" -o /tmp/bundle-$1.js; head -c 200 /tmp/bundle-$1.js | grep -q '"type"' && node -e "const j=JSON.parse(require('fs').readFileSync('/tmp/bundle-$1.js','utf8'));console.log(j.message.slice(0,500));console.log(j.cause&&j.cause._expoImportStack)" || echo BUNDLE_OK $(wc -c < /tmp/bundle-$1.js)
