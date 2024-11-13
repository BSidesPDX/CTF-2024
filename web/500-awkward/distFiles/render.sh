#!/bin/bash


HTMLFILE="html/content/${2}.html"

if [ -e $HTMLFILE ]
then
    printf "render.sh:found %s 200 %s\n" $1 $2 >&2
    HTML="$(cat html/partials/head.html)$(cat $HTMLFILE)$(cat html/partials/foot.html)"
    printf "%s 200 Ok\r\n" $3
    printf "content-length: %s\r\n" "${#HTML}"
    printf "connection: close\r\n"
    printf "\r\n"
    printf "%s" "${HTML}"
else
    printf "render.sh:not_found %s 404 %s\n" $1 $2 >&2
    printf "%s 404 Not Found\r\n" $3
    printf "connection: close\r\n"
fi
