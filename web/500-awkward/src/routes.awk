BEGIN {
    FS=" "
    MATCHED=0
}
$2 ~ /^\/$/ {
    MATCHED=1
    print $0 | "awk -f controllers/index.awk"
    exit 0
}
$2 ~ /^\/posts(\/.*)?$/ {
    MATCHED=1
    print $0 | "awk -f controllers/posts.awk"
    exit 0
}
END {
    if (!MATCHED) {
        print "routes.awk:not_found", $1, 404, $2 | "cat >&2"
        print $3, 404, "Not Found\r"
        print "Connection: close\r"
    }
}
