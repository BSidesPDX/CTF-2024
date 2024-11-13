# medusurf

We turned the /admin route to stone for being insecure. Problem solved! ...right?

| Authors | Categories |
|---|---|
| Evan Johnson (@evanj2357) | Web |

## How to run

```bash
docker build -t <tag> .
docker run -p 8080:8080 <tag>
```

Then browse to `http://localhost:8080/`.

## Development

To run the web server:
```bash
gleam run   # Run the project
gleam test  # Run the tests
```

To run the mainenance app in server mode:
```bash
pip3 install -r maintenance/requirements.txt
tcpserver -c 20 0 1337 python3 maintenance/maintenance.py &
```
