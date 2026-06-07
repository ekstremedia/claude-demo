# AGENTS.md

Working notes for AI agents (and humans) on this repo. This is a **demo project
for showcasing Claude Code**: a Laravel + Vue + Inertia app that runs entirely in
Docker. Keep this file updated as the project evolves — record decisions,
findings, and gotchas here.

## What this is

A minimal but real single-page app:

- **Laravel 13** serves the backend and routing.
- **Inertia v3** is the glue between Laravel and Vue — there is **no separate
  API**. Controllers/routes return `Inertia::render('PageName', [...props])` and
  the matching Vue component renders client-side.
- **Vue 3** (`<script setup lang="ts">`) for the UI.
- **Tailwind v4** for styling (via `@tailwindcss/vite`, configured in
  `resources/css/app.css` — no `tailwind.config.js`).
- **Vite 8** for the dev server / HMR and production builds.
- **Postgres 17**, **Redis 7**, **Mailpit** as backing services.
- Everything runs in **Docker**; you start/stop it with `make up` / `make down`.

## Quick start

```bash
make up        # build (first run) + start everything, prints the URLs
make down      # stop everything
```

Then open **http://localhost:8120**. Mailpit (caught mail) is at
**http://localhost:8125**.

`make up` copies `.env.example` → `.env` if there's no `.env` yet. The app
container's entrypoint generates `APP_KEY` (if missing), waits for Postgres,
runs `php artisan migrate --force`, and links storage on every boot.

### Common commands (see `make help`)

| Command | What it does |
| --- | --- |
| `make up` / `make down` | start / stop the stack |
| `make build` | rebuild images, then start |
| `make restart` | restart containers |
| `make shell` | bash shell in the `app` container |
| `make tinker` | Laravel Tinker |
| `make logs` / `make logs-all` | tail app / all logs |
| `make migrate` / `make fresh` / `make seed` | DB migrations / fresh+seed / seed |
| `make test` | run the test suite |
| `make destroy` | stop and delete volumes (local only) |

All app commands run **inside** the container (`docker compose exec app ...`).
Don't run `php artisan` / `npm` on the host — the host doesn't have the services
(Postgres/Redis) or the matching PHP extensions.

## Architecture: one app container, many processes

The `app` image bundles **PHP-FPM + nginx + Vite + a queue worker**, started
together by **supervisor** (`docker/supervisord.conf`):

- `php-fpm` — runs the Laravel app.
- `nginx` (`docker/nginx.conf`) — serves `public/`, proxies `.php` to FPM on
  `127.0.0.1:9000`, long-caches hashed assets under `/build/assets/`.
- `vite` (`npm run dev`) — the dev server / HMR. Published **1:1** on port 5173
  (host == container) because the browser loads assets/HMR straight from that
  port. While it runs it writes `public/hot`, and Blade's `@vite` serves from
  the dev server instead of the built files.
- `queue` — `php artisan queue:work` against Redis.

The backing services are separate containers (`docker-compose.yml`): `postgres`,
`redis`, `mailpit`. The app `depends_on` Postgres + Redis being **healthy**.

### How a request flows

1. Browser → nginx (port 80 in-container, published as `APP_HOST_PORT` 8120).
2. nginx → PHP-FPM → Laravel route in `routes/web.php`.
3. Route returns `Inertia::render('Welcome', [...])`.
4. `HandleInertiaRequests` middleware wraps it; first load returns the
   `resources/views/app.blade.php` shell with `@inertia` + `@vite`.
5. `resources/js/app.ts` boots the Inertia/Vue app, resolves the page from
   `resources/js/Pages/`, and mounts it. Subsequent `<Link>` clicks fetch JSON
   and swap the page component — no full reload.

## Key files

```text
routes/web.php                         # / and /dashboard → Inertia::render
app/Http/Middleware/HandleInertiaRequests.php   # shared props (appName, flash)
bootstrap/app.php                      # registers the Inertia middleware (web group)
resources/views/app.blade.php          # Inertia root template (@inertia, @vite)
resources/js/app.ts                    # Inertia/Vue client entry
resources/js/Layouts/AppLayout.vue     # shared nav/footer layout
resources/js/Pages/Welcome.vue         # landing page (receives laravel/php version props)
resources/js/Pages/Dashboard.vue       # demo page (Vue reactivity + SPA nav)
resources/css/app.css                  # Tailwind v4 entry + theme
vite.config.ts                         # Vue plugin, @ alias, Docker dev-server settings
Dockerfile                             # PHP 8.4-fpm + nginx + supervisor + Node 22
docker/{nginx.conf,supervisord.conf,entrypoint.sh}
docker-compose.yml                     # app + postgres + redis + mailpit
Makefile                               # make up / down / etc.
```

## Conventions

- **Pages** live in `resources/js/Pages/` and are referenced by name in
  `Inertia::render('Welcome')`. Vite code-splits one chunk per page.
- Import app code with the `@` alias → `resources/js` (e.g.
  `import AppLayout from '@/Layouts/AppLayout.vue'`).
- Vue components use `<script setup lang="ts">`. Run `npm run typecheck`
  (`vue-tsc`) inside the container to type-check.
- Shared data available to every page comes from
  `HandleInertiaRequests::share()` — currently `appName` and `flash`.

## Laravel Boost MCP (wired for Docker)

`laravel/boost` is installed (dev dependency). It exposes an MCP server that
gives an AI agent live, app-aware tools (read the DB schema, run Tinker, search
docs for the exact installed versions, read logs, etc.).

Because the app runs **inside the container**, the MCP server must run there too
— not on the host. The generated configs were rewritten to exec into the `app`
service:

```jsonc
// .mcp.json (Claude Code) — also .cursor/mcp.json, .codex/config.toml, opencode.json
{
  "mcpServers": {
    "laravel-boost": {
      "command": "docker",
      "args": ["compose", "exec", "-T", "app", "php", "artisan", "boost:mcp"]
    }
  }
}
```

- `-T` disables TTY allocation so MCP's stdio pipe works.
- The container must be running (`make up`) for the MCP server to connect.
- `make mcp` runs the same command manually if you need to debug it.

## Decisions & findings (newest first)

- **Verified end-to-end** (`make up` from a clean build): all containers report
  healthy; `/`, `/dashboard`, `/up` all return 200; the initial Inertia payload
  is the `Welcome` page with the expected props; Vite serves + transforms every
  page module; the Boost MCP server completes the MCP `initialize` handshake when
  exec'd into the container.
- **Inertia v3 renders the page payload as a separate JSON `<script>` tag**
  (`<script data-page="app" type="application/json">{...}</script>` + an empty
  `<div id="app">`), not as a `data-page="..."` attribute on the root div like
  v1/v2. Just a thing to know when inspecting the server-rendered HTML.
- **Boost auto-injects a browser-logger** into pages when it detects the MCP
  server is active, POSTing `console.*` + uncaught errors to
  `/_boost/browser-logs`. That's how the MCP `browser-logs` tool sees frontend
  errors — expect the extra inline `<script>` in dev HTML.
- **PHP 8.4 in the image** matches the version that resolved `composer.lock`
  locally, so `composer install` from the lock is guaranteed compatible. (The
  reference kit uses 8.5; we pin 8.4 here to avoid lockfile drift.)
- **Inertia v3** specifically (`inertiajs/inertia-laravel ^3.0` +
  `@inertiajs/vue3 ^3.x`), per the request and matching `../laravel-starter-kit`.
- **Pared down from the reference kit.** `../laravel-starter-kit` was the
  pattern source but is a heavyweight production kit (Reverb, Horizon, Pulse,
  Gotenberg, ffmpeg, imagick, PWA, i18n, PrimeVue…). For a clean demo we kept the
  core architecture (single app container: FPM + nginx + Vite under supervisor;
  Postgres + Redis + Mailpit) and dropped the rest.
- **Named volumes for `vendor/` and `node_modules/`** shadow the bind mount.
  Docker seeds them from the built image on first run, which avoids slow
  bind-mount IO on Docker Desktop and keeps host/container deps isolated. If you
  change dependencies, rebuild (`make build`) or run `make composer-install` /
  `make npm-install` inside the container.
- **Vite needs `usePolling`** (set in `vite.config.ts`): Docker bind mounts on
  macOS/Windows don't reliably deliver native FS events, so HMR would miss edits
  without it.
- **Redis** backs sessions, cache, and the queue; **Postgres** is the database;
  **Mailpit** catches outbound mail (SMTP on 1025, UI on 8125).
