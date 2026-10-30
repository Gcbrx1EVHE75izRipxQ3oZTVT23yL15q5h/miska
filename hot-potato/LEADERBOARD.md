# Ring Dive leaderboard — local and free

Production uses only browser-local profile storage. `API_URL` in `leaderboard-client.mjs` remains an empty string; the premium title hub makes no leaderboard network requests. No paid service, database, currency, shop, subscription or account was added.

- Real finished flights are sorted by score, then passed rings, then earliest date. Up to 50 are retained, with a readable top 20 view.
- The most recent real flight is stored independently and highlighted in the list; if outside the top 20, its result remains visible below it.
- All-time and this-week views use the shared `weekStartUTC` definition: Monday 00:00 UTC. The UI explicitly states the boundary and refreshes an open weekly view across it and on returning from a background tab.
- The UI identifies the list as **this browser's results**. It never invents competitors or presents local runs as global standings.
- Practice/demo runs do not write records, history, achievements or statistics.
- Existing profile-v2 names, audio levels and records migrate compatibly; best-score-v1 is also imported. No previous data is intentionally deleted.

The standalone Node/SQLite server and client adapter are retained as dormant development code. Their replay-verification tests still run. They are not deployed or connected to the premium UI. Any future shared online leaderboard would require a separately authorized integration and persistent storage; it is outside this release and must not introduce costs without explicit authorization.
