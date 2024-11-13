#!/bin/bash

read -r INPUTLINE
echo "${INPUTLINE}" | awk -f server.awk
