BEGIN {
    FS=" "
    MATCHED=0
}
$1 ~ /^GET$/ {
    MATCHED=1
    system("./render_index.sh " $3)
    exit 0
}
END {
    if (!MATCHED) {
        print "controllers/index.awk:not_allowed", $1, 405, $2 | "cat >&2"
        print $3, 405, "Method Not Allowed\r"
        print "Connection: close\r\n\r"
    }
}
