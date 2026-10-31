# mock-verifier

A stand-in Verifier for local development (`docker-compose.dev.yml`) and the backend's
integration tests (Micronaut Test Resources, see `backend/src/test/resources/application-test.yml`).
It implements the whole Verifier API (`openapi/verifier-api.yml`) with scripted, preset
responses — dev/test infrastructure, not a published contract.

## What it does

| Operation                | Response                                                                                                     |
|--------------------------|--------------------------------------------------------------------------------------------------------------|
| `GET /description`       | `description.json`, verbatim.                                                                                |
| `POST /jobs/{id}`        | `202` with no body. Remembers the program's statement ids and the resolved Settings under `{id}`.            |
| `GET /jobs/{id}` (WS)    | Three fixed `log` messages, then `{"type":"done","proven":true,"status":"Mock Verifier: whole run checked"}`, then a normal close. Same for every job.  |
| `GET /jobs/{id}/result`  | `{"<statementId>": {"proven": true, "status": "Mock verification passed (id1=value1, id2=value2, …)"}, …}` for every statement id the program carried; every resolved Setting is echoed, sorted by id. |

With the `shouldPass` Setting off, the run fails instead: the done message carries
`"proven":false,"status":"Mock Verifier: whole run failed"` and every result entry is
`{"proven": false, "status": "Mock verification failed (…)"}`.

Guards, all as `application/problem+json`: `404` for an unknown job or path, `400` for a start
request that is not JSON or lacks `program`/`files`/`settings`, `409` for a result fetched before
the status stream has sent `done`, `426` for a plain (non-upgrade) `GET /jobs/{id}`. Re-posting an
existing job id restarts that job. Job ids are any path segment, not validated as UUIDs.

Job state lives in memory only; every message on the status stream is preceded by a
`MESSAGE_DELAY_MS` pause (default 200 ms, so a run is visibly live in the editor's console).

## Running

Node 24, one dependency (`ws`, the WebSocket server; Node ships a WebSocket client but no server).

```
npm ci
npm start                    # PORT=80 by default; PORT=8081 npm start for a local run
npm test                     # node --test, no test dependencies
```

The container (`Dockerfile`) listens on port 80, so nothing in the compose stack or the
Test Resources config depends on the runtime. Try the full flow against the dev stack:

```
curl -X POST localhost:8081/jobs/demo -H 'content-type: application/json' \
  -d '{"program":{"statement":{"id":1,"name":"s","type":"STATEMENT","programStatement":"x = 1;"}},"files":[],"settings":{"strategy":"strict","threshold":"50"}}'
websocat ws://localhost:8081/jobs/demo      # or any WebSocket client
curl localhost:8081/jobs/demo/result
```

## Extending

- Self-Description: edit `description.json`.
- The script (log lines, the run's aggregate `proven` and its `status`): `LOG_LINES` /
  `DONE_MESSAGE` in `mock-verifier.js`.
- Per-statement results: `resultOf()` in `mock-verifier.js`.
- Keep the tests in `test/` in step; they start the service in-process on a free port.
