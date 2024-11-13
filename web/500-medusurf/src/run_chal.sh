#!/bin/sh


cd /app/maintenance
tcpserver -4 -c 20 0 1337 python3 /app/maintenance/maintenance.py &

cd /app
/app/entrypoint.sh run
