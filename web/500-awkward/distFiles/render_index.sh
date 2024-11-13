#!/bin/bash

LINKS=$(ls html/content/posts | awk -v 'RF=" "' '{ print "<li><a href=\"/posts/"$1"\">"$1"</a></li>"}' | sed 's/\.html//g')
HTML="$(cat html/partials/head.html)$(cat html/content/index.html)${LINKS}$(cat html/partials/foot.html)"

printf "render_index.sh GET 200 /\n" >&2

printf "%s 200 Ok\r\n" $1
printf "content-length: %s\r\n" ${#HTML}
printf "connection: close\r\n"
printf "\r\n"
printf "%s" "${HTML}"
