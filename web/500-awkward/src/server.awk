BEGIN {
    RS="\r"
    FS=" "
    MATCHED=0
}
# HTTP method, path, version
# (only 1.1 is supported)
$0 ~ /^[A-Z]+ \/.* HTTP\/1\.1$/ {
    MATCHED=1
    METHOD=$1
    HTTPVERSION=$3
    split($2, FRAGMENT_SPLIT, /[#]/)
    FRAGMENT=FRAGMENT_SPLIT["2"]
    split(FRAGMENT_SPLIT["1"], QUERY_SPLIT, /[?]/)
    QUERY=QUERY_SPLIT["2"]
    ROUTE=QUERY_SPLIT["1"]
    if (match(/['"]/, ROUTE) && match(/\.\./, ROUTE) && match(/\/\/+/, ROUTE)) {
        print "server.awk:waf", $1, "400", $2 | "cat >&2"
        print HTTPVERSION, 400, "Bad Request\r"
        print "Connection: close\r\n\r"
    } else {
        REQUEST=METHOD " " ROUTE " " HTTPVERSION
        if (QUERY) {
            REQUEST=REQUEST " ?" QUERY
        }
        if (FRAGMENT) {
            REQUEST=REQUEST " #" FRAGMENT
        }
        print REQUEST | "awk -f routes.awk"
    }
    exit 0
}
END {
    if (!MATCHED) {
        print "server.awk:fallthrough", $0 | "base64 >&2"
        print "server.awk:fallthrough", $1, "400", $2 | "cat >&2"
        print "HTTP/1.1 400 Bad Request\r"
        print "Connection: close\r\n\r"
    }
}
