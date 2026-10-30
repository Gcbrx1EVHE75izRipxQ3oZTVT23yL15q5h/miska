# Shared leaderboard — prepared, not enabled

The current production Render service is a static site. Its existing deployment and URL stay unchanged. The game already has a working browser-local leaderboard, explicitly labeled as this device's scores.

A separate `leaderboard-server.mjs` provides durable SQLite storage, server-generated session seeds, one-use tokens, score replay verification using the exact game simulation, time plausibility, bounded input and request rates, and a 50-player all-time / UTC-week leaderboard. Tests/demo runs are rejected. The API publishes nickname, rings, score and submission date; no accounts or personal contact details are collected. Automated valid replays remain possible: this is not competitive-grade anti-bot protection.

To activate after the owner approves infrastructure:

1. Create a **dedicated** Ring Dive Node 24 web service in Miska's workspace, same GitHub repository/master. Start: `node hot-potato/leaderboard-server.mjs`. No package installation is needed.
2. Attach a persistent disk and set `DB_PATH=/var/data/ring-dive.sqlite`, `GAME_ORIGIN=https://hot-potato-play.onrender.com`, `NODE_VERSION=24`. Do not deploy to an ephemeral filesystem: records would be lost on restart. Do not reuse accounting, CNTCTLSS, or other games' services/databases.
3. Verify `/health`, two independent clients, duplicate-token rejection, actual game submissions, week/all filtering and persistence over a redeploy. Take a SQLite online backup regularly; never commit the database.
4. Set `API_URL` in `leaderboard-client.mjs` to the verified service URL, publish the static game, and retest mobile/offline fallbacks.

The frontend requests a server session before a ranked start when configured, records only actual tap ticks, submits the completed replay, and falls back visibly to the local table when disconnected. No old local scores are uploaded retrospectively. This API has not been deployed, and no paid resource has been created. A Render persistent disk requires a paid web service; pricing must be confirmed before creation.
