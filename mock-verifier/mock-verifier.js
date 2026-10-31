/**
 * A stand-in Verifier implementing the Verifier API (openapi/verifier-api.yml) with scripted,
 * preset responses: the Self-Description from description.json, plus start-a-job, the status
 * stream and the result fetch. Every job runs the same fixed script, so both local development
 * and integration tests see the same messages and results every time; only the `shouldPass`
 * Setting flips the verdict.
 *
 * Per-job state is one in-memory map; nothing is persisted across restarts.
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { WebSocketServer } from "ws";

const description = readFileSync(new URL("./description.json", import.meta.url));

/**
 * The status stream's fixed script: these log lines, then one done message — the run's verdict
 * plus the Verifier Status the backend shows on the program's root.
 */
const LOG_LINES = [
  "Mock Verifier: analysing program",
  "Mock Verifier: checking every statement against the resolved Settings",
  "Mock Verifier: all statements checked",
];
const DONE_PASSED = { type: "done", proven: true, status: "Mock Verifier: whole run checked" };
const DONE_FAILED = { type: "done", proven: false, status: "Mock Verifier: whole run failed" };

/** Passes unless the `shouldPass` Setting is false; a job started without it passes. */
function passes(job) {
  return job.settings.shouldPass !== false;
}

const JOB_PATH = /^\/jobs\/([^/]+)$/;
const RESULT_PATH = /^\/jobs\/([^/]+)\/result$/;

/**
 * Starts the mock Verifier on `port` (0 picks a free one). `messageDelayMs` is the pause before
 * each message on the status stream, so a run is visibly live in the console; tests pass 0.
 * Resolves to `{ port, close() }` once the socket is listening.
 */
export function startMockVerifier({ port = 80, messageDelayMs = 200 } = {}) {
  /** Job id -> { statementIds, settings, done }. */
  const jobs = new Map();
  const wss = new WebSocketServer({ noServer: true });

  const server = createServer((req, res) => handleHttp(req, res, jobs));
  server.on("upgrade", (req, socket, head) => {
    const id = jobIdOf(req, JOB_PATH);
    const job = jobs.get(id);
    if (job === undefined) {
      // The upgrade handler owns the raw socket, so the problem response is written by hand.
      const body = JSON.stringify(problemBody(req, 404, "Not Found", `No job with id ${id}`));
      socket.end(`HTTP/1.1 404 Not Found\r\nContent-Type: application/problem+json\r\n`
        + `Content-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`);
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => streamStatus(ws, job, messageDelayMs));
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      resolve({
        port: server.address().port,
        close: () => new Promise((done) => {
          wss.clients.forEach((client) => client.terminate());
          server.close(done);
        }),
      });
    });
  });
}

async function handleHttp(req, res, jobs) {
  const path = pathOf(req);
  if (req.method === "GET" && path === "/description") {
    res.writeHead(200, { "content-type": "application/json" }).end(description);
    return;
  }

  const startId = jobIdOf(req, JOB_PATH);
  if (startId !== undefined && req.method === "POST") {
    const body = await readJson(req);
    const invalid = validateStartRequest(body);
    if (invalid) {
      problem(req, res, 400, "Malformed Request Body", invalid);
      return;
    }
    jobs.set(startId, { statementIds: statementIds(body.program.statement), settings: body.settings, done: false });
    res.writeHead(202).end();
    return;
  }
  if (startId !== undefined && req.method === "GET") {
    if (!jobs.has(startId)) {
      problem(req, res, 404, "Not Found", `No job with id ${startId}`);
    } else {
      problem(req, res, 426, "Upgrade Required", "The status stream is a WebSocket; open it with an Upgrade request.");
    }
    return;
  }

  const resultId = jobIdOf(req, RESULT_PATH);
  if (resultId !== undefined && req.method === "GET") {
    const job = jobs.get(resultId);
    if (job === undefined) {
      problem(req, res, 404, "Not Found", `No job with id ${resultId}`);
    } else if (!job.done) {
      problem(req, res, 409, "Conflict", `Job ${resultId} has not sent done on its status stream yet`);
    } else {
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(resultOf(job)));
    }
    return;
  }

  problem(req, res, 404, "Not Found", `No such operation: ${req.method} ${path}`);
}

/** Same sequence on every connection, including a reconnect to a job that already finished. */
async function streamStatus(ws, job, messageDelayMs) {
  const pause = () => new Promise((resolve) => setTimeout(resolve, messageDelayMs));
  for (const message of LOG_LINES) {
    await pause();
    if (ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify({ type: "log", message }));
  }
  await pause();
  if (ws.readyState !== ws.OPEN) return;
  job.done = true; // before the done message, so a result fetch racing it never sees 409
  ws.send(JSON.stringify(passes(job) ? DONE_PASSED : DONE_FAILED), () => ws.close(1000));
}

function resultOf(job) {
  const summary = Object.keys(job.settings)
    .sort()
    .map((id) => `${id}=${job.settings[id]}`)
    .join(", ");
  const proven = passes(job);
  const verdict = proven ? "Mock verification passed" : "Mock verification failed";
  const status = summary ? `${verdict} (${summary})` : verdict;
  return Object.fromEntries(job.statementIds.map((id) => [String(id), { proven, status }]));
}

/** Returns why `body` is not a start request, or null when it is one. */
function validateStartRequest(body) {
  if (body === undefined) return "Request body is not valid JSON";
  if (typeof body !== "object" || body === null || Array.isArray(body)) return "Request body must be a JSON object";
  for (const field of ["program", "files", "settings"]) {
    if (body[field] === undefined) return `Request body is missing required field '${field}'`;
  }
  if (typeof body.program.statement !== "object" || body.program.statement === null) {
    return "Request body's program has no root statement";
  }
  return null;
}

/** Every statement id in the tree, root first, in source order. */
function statementIds(statement) {
  const children = {
    COMPOSITION: (s) => [s.firstStatement, s.secondStatement],
    REPETITION: (s) => [s.loopStatement],
    SELECTION: (s) => s.commands ?? [],
  }[statement.type]?.(statement) ?? [];
  return [statement.id, ...children.filter(Boolean).flatMap(statementIds)];
}

function readJson(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        resolve(undefined);
      }
    });
  });
}

function problem(req, res, status, title, detail) {
  res.writeHead(status, { "content-type": "application/problem+json" })
    .end(JSON.stringify(problemBody(req, status, title, detail)));
}

function problemBody(req, status, title, detail) {
  return { type: "about:blank", title, status, detail, instance: pathOf(req) };
}

/** The job id in the request path if it matches `pattern`, else undefined. */
function jobIdOf(req, pattern) {
  return pathOf(req).match(pattern)?.[1];
}

function pathOf(req) {
  return new URL(req.url, "http://localhost").pathname;
}
