#!/bin/bash

cd /app
tcpserver -v -c 50 0 8080 ./server.sh
