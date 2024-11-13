# Scheming with Templates

What happens when someone twirls their Handlebars Mustache while
trying to hatch a little Scheme?

| Authors | Categories |
|---|---|
| Evan Johnson (@evanj2357) | Pwn, Web |

## How to run

To install dependencies and run the REPL locally, run
the following commands in the project directory:
```bash
pnpm i
pnpm run dev
```

You can also use the provided Dockerfile:
```bash
docker build -t scheming .
docker run -p 31337:31337 scheming
```
Then connect with `nc 127.1 31337`.
