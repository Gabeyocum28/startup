# Deploying polyrhythmd

Target: Oracle Cloud Ampere A1 (`oracle-a1`, linux/arm64, Ubuntu 24.04, Docker 29 + Compose v2).

Layout on the server:

```
~/stacks/polyrhythmd/            # this repo, rsynced (compose + Dockerfile + source)
~/stacks/polyrhythmd/.env        # secrets, never committed (see .env.example)
~/stacks/caddy/                  # shared reverse proxy, owns ports 80/443
```

Containers: `polyrhythmd-api` (Express on :3000, `web` network, no host ports) and a
one-shot `polyrhythmd-frontend` that copies the Vite build into the `polyrhythmd_web`
volume, which Caddy mounts read-only at `/www/polyrhythmd`. Database is MongoDB Atlas.

## First-time setup

```sh
# 1. Copy the repo to the server (excludes node_modules, .git, .env)
rsync -az --delete \
  --exclude node_modules --exclude .git --exclude dist --exclude .env \
  ./ oracle-a1:~/stacks/polyrhythmd/

# 2. Create the secrets file on the server
ssh oracle-a1 'cp -n ~/stacks/polyrhythmd/.env.example ~/stacks/polyrhythmd/.env && chmod 600 ~/stacks/polyrhythmd/.env'
ssh oracle-a1 'nano ~/stacks/polyrhythmd/.env'   # set MONGO_URI

# 3. Build and start (build happens on the box, natively arm64)
ssh oracle-a1 'cd ~/stacks/polyrhythmd && docker compose up -d --build'

# 4. Caddy: the block for polyrhythmd.gabeyocum.com is already in
#    ~/stacks/caddy/Caddyfile and the polyrhythmd_web volume is mounted in
#    ~/stacks/caddy/docker-compose.yml at /www/polyrhythmd (it cannot live under
#    /srv because the `site` volume is mounted there read-only). Reload:
ssh oracle-a1 'docker compose -f ~/stacks/caddy/docker-compose.yml up -d'
```

## Deploy an update

```sh
rsync -az --delete \
  --exclude node_modules --exclude .git --exclude dist --exclude .env \
  ./ oracle-a1:~/stacks/polyrhythmd/
ssh oracle-a1 'cd ~/stacks/polyrhythmd && docker compose up -d --build'
```

`--build` rebuilds both images; the frontend job re-runs and refreshes the volume.
Caddy serves the new files immediately, no Caddy restart needed.

## Verify

```sh
ssh oracle-a1 'cd ~/stacks/polyrhythmd && docker compose ps && docker stats --no-stream polyrhythmd-api'
curl -s https://polyrhythmd.gabeyocum.com/api/health
curl -s "https://polyrhythmd.gabeyocum.com/api/search?q=radiohead" | head -c 300
```

`polyrhythmd-frontend` shows `Exited (0)` in `compose ps`. That is expected.

## Roll back

Images are tagged `:local` and rebuilt in place, so roll back by rebuilding the
previous commit:

```sh
git checkout <previous-commit-or-tag>
rsync -az --delete \
  --exclude node_modules --exclude .git --exclude dist --exclude .env \
  ./ oracle-a1:~/stacks/polyrhythmd/
ssh oracle-a1 'cd ~/stacks/polyrhythmd && docker compose up -d --build'
git checkout main
```

To keep a rollback image without a rebuild, tag it before deploying:

```sh
ssh oracle-a1 'docker tag polyrhythmd-api:local polyrhythmd-api:prev'
# ...deploy... then if needed:
ssh oracle-a1 'cd ~/stacks/polyrhythmd && docker tag polyrhythmd-api:prev polyrhythmd-api:local && docker compose up -d --no-build polyrhythmd-api'
```

## Stop / remove

```sh
ssh oracle-a1 'cd ~/stacks/polyrhythmd && docker compose down'        # keeps volume
ssh oracle-a1 'cd ~/stacks/polyrhythmd && docker compose down -v'     # also drops polyrhythmd_web (Caddy must be restarted after)
```

## Logs

```sh
ssh oracle-a1 'docker logs -f --tail 100 polyrhythmd-api'
```
