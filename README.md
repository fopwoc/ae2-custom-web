# AE2 Terminal

A modern, mobile-friendly web terminal for [AE2 Web Integration](https://github.com/kuba6000/AE2-Web-Integration). It keeps the mod API behind a typed SvelteKit server proxy, owns browser login sessions, and presents inventory, craft planning, crafting CPUs, and tracked activity without exposing the upstream service publicly.

> [!NOTE]
> This project contains AI-generated code. See [AI_USAGE.md](AI_USAGE.md) for details.

```text
Browser → HTTPS Caddy → 127.0.0.1:2325 → AE2 Terminal → http://gtnh:2324 → AE2 Web Integration
```

## Features

- Searchable inventory with stored/craftable filters and compact mobile layouts
- Craft simulation, missing-material review, CPU selection, and submission
- Crafting CPU capacity, ingredients, job state, and guarded cancellation
- Crafting history, timing detail, and per-network tracking controls
- HttpOnly, `Secure`, `SameSite=Strict` session cookie; the upstream bearer token is never available to client JavaScript
- Runtime validation of every upstream response through the reusable `@ae2-terminal/ae2-api` package

## Run with Docker Compose

1. Install AE2 Web Integration on the Minecraft server and verify it responds at `http://gtnh:2324` from the Docker network.
2. Leave the default local image name when building, or set `IMAGE=ghcr.io/<owner>/ae2-terminal:<version>` after publishing.
3. Copy `.env.example` to `.env` and adjust the upstream URL if necessary.
4. Start the service:

   ```sh
   docker compose up --build -d
   ```

5. Copy `deploy/Caddyfile.example` into the homelab Caddy configuration and replace `ae2.example.com` with the real HTTPS hostname.

The Compose port is deliberately bound to `127.0.0.1:2325`; only Caddy should expose the terminal. Set `PUBLIC_MODE=true` only when players should be able to register their own accounts. Registration still requires the corresponding Minecraft player to be online.

## Local development

Requires Node.js 26 and pnpm 11.

```sh
corepack enable
pnpm install
VERSION=0.0.0-dev pnpm dev
```

The development server listens on `http://localhost:5173`. `UPSTREAM_URL` defaults to `http://gtnh:2324`.

Useful checks:

```sh
VERSION=0.0.0-test pnpm check
VERSION=0.0.0-test pnpm test
VERSION=0.0.0-test pnpm build
pnpm format:check
```

## Repository layout

```text
apps/terminal/       SvelteKit UI and authenticated BFF
packages/ae2-api/    Typed AE2 Web Integration client and contracts
deploy/              Reverse-proxy examples
scripts/             Source-control-derived build version tooling
```

## Configuration

| Variable        | Default            | Purpose                                                     |
| --------------- | ------------------ | ----------------------------------------------------------- |
| `UPSTREAM_URL`  | `http://gtnh:2324` | Internal AE2 Web Integration base URL                       |
| `PUBLIC_MODE`   | `false`            | Enables player registration                                 |
| `COOKIE_SECURE` | `true` in Compose  | Requires HTTPS; use `false` only for local HTTP development |
| `LOG_LEVEL`     | `error`            | `debug`, `info`, `warn`, or `error`                         |
| `PORT`          | `3000`             | Container HTTP port                                         |
| `VERSION`       | Git-derived        | Explicit build identity for non-Git builds                  |

Tagged builds use exact semantic tags such as `1.2.3`. Untagged Git builds use `<commit-date>-<short-hash>`.

## Compatibility

The client contracts target the HTTP behavior of AE2 Web Integration’s GTNH 1.7.10 branch at commit `e44385d65619dac04381f0d51ae2c3e2bd9b2002`. A contract mismatch is surfaced as a server error instead of silently rendering incorrect state.

## License

This project uses the WTFNMFPL. See [LICENSE](LICENSE), [COPYRIGHT](COPYRIGHT), and [THIRD_PARTY.md](THIRD_PARTY.md).
