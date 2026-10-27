#!/bin/sh
# usage: serve.sh <app> <port>  (TEMPORARY)
cd "$(dirname "$0")/../../../apps/$1" && CI=1 exec npx expo start --web --port $2 --clear --no-dev --minify 2>&1 | grep -v iosAppId
