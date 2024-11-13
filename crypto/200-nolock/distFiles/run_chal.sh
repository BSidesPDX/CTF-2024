#!/bin/sh
exec 2>/dev/null
cd /chal
timeout -k1 40 stdbuf -i0 -o0 -e0 python3 ./challenge.py
