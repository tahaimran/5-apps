#!/bin/sh
PID=$(netstat -ano | grep ":$1 " | grep LISTEN | awk '{print $5}' | head -1); [ -n "$PID" ] && taskkill //F //PID $PID //T >/dev/null && echo killed $PID
