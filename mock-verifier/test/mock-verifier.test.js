import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { request } from "node:http";
import { startMockVerifier } from "../mock-verifier.js";

/**
 * A start-a-job request whose program nests every statement kind once, so the
 * scripted result's key set can be checked against all ids: 0..5.
 */
function startRequest() {
  const condition = (condition) => ({ condition });
  return {
    program: {
      name: "demo",
      javaVariables: ["int x"],
      preCondition: condition("energy <= energyBudget"),
      statement: {
        id: 0,
        name: "root",
        type: "COMPOSITION",
        firstStatement: { id: 1, name: "s1", type: "STATEMENT", programStatement: "x = 1;" },
        secondStatement: {
          id: 2,
          name: "loop",
          type: "REPETITION",
          guard: condition("x > 0"),
          loopStatement: {
            id: 3,
            name: "branch",
            type: "SELECTION",
            guards: [condition("x > 1"), condition("x <= 1")],
            commands: [
              { id: 4, name: "s4", type: "STATEMENT", programStatement: "x = x - 1;" },
              { id: 5, name: "s5", type: "SKIP" },
            ],
          },
        },
      },
    },
    files: [{ path: "Demo.java", content: "class Demo {}" }],
    settings: { reportTitle: "Mock verification", threshold: "50", strategy: "strict", verbose: true },
  };
}

function postJob(base, id, body = startRequest()) {
  return fetch(`${base}/jobs/${id}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/**
 * Opens the status stream and resolves once the server closes it, with every message parsed and
 * the close code; `errored` records whether the connection failed outright.
 */
function streamStatus(base, id) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`${base.replace("http", "ws")}/jobs/${id}`);
    const messages = [];
    let errored = false;
    ws.addEventListener("message", (event) => messages.push(JSON.parse(event.data)));
    ws.addEventListener("error", () => { errored = true; });
    ws.addEventListener("close", (event) => resolve({ messages, code: event.code, errored }));
  });
}

/** A raw WebSocket upgrade request, resolving to the HTTP response the server refuses it with. */
function upgradeRequest(base, id) {
  return new Promise((resolve, reject) => {
    const req = request(`${base}/jobs/${id}`, {
      headers: {
        connection: "Upgrade",
        upgrade: "websocket",
        "sec-websocket-key": "dGhlIHNhbXBsZSBub25jZQ==",
        "sec-websocket-version": "13",
      },
    });
    req.on("response", (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({
        status: res.statusCode,
        headers: new Headers(res.headers),
        json: async () => JSON.parse(Buffer.concat(chunks).toString("utf8")),
      }));
    });
    req.on("upgrade", (res, socket) => { socket.destroy(); reject(new Error("upgrade was accepted")); });
    req.on("error", reject);
    req.end();
  });
}

async function assertProblem(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers.get("content-type"), /^application\/problem\+json/);
  const problem = await response.json();
  assert.equal(problem.status, status);
  assert.equal(typeof problem.title, "string");
  assert.equal(typeof problem.detail, "string");
  return problem;
}

describe("mock Verifier", () => {
  let server;
  let base;

  before(async () => {
    server = await startMockVerifier({ port: 0, messageDelayMs: 0 });
    base = `http://127.0.0.1:${server.port}`;
  });

  after(() => server.close());

  describe("GET /description", () => {
    it("serves description.json unchanged as application/json", async () => {
      const response = await fetch(`${base}/description`);

      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /^application\/json/);
      const expected = JSON.parse(await readFile(new URL("../description.json", import.meta.url), "utf8"));
      assert.deepEqual(await response.json(), expected);
    });
  });

  describe("anything else", () => {
    it("is a 404 problem", async () => {
      await assertProblem(await fetch(`${base}/nope`), 404);
    });
  });

  describe("POST /jobs/{id}", () => {
    it("acknowledges a well-formed start request with a bare 202", async () => {
      const response = await postJob(base, "11111111-1111-1111-1111-111111111111");

      assert.equal(response.status, 202);
      assert.equal(await response.text(), "");
    });

    it("rejects a body that is not JSON with a 400 problem", async () => {
      await assertProblem(await postJob(base, "bad-json", "{not json"), 400);
    });

    it("rejects a JSON body missing program, files or settings with a 400 problem", async () => {
      const { program, files } = startRequest();

      const problem = await assertProblem(await postJob(base, "no-settings", { program, files }), 400);

      assert.match(problem.detail, /settings/);
    });
  });

  describe("GET /jobs/{id}/result", () => {
    it("is a 404 problem for a job that was never started", async () => {
      await assertProblem(await fetch(`${base}/jobs/never-started/result`), 404);
    });

    it("is a 409 problem for a job whose status stream has not sent done yet", async () => {
      await postJob(base, "started-not-done");

      await assertProblem(await fetch(`${base}/jobs/started-not-done/result`), 409);
    });
  });

  describe("GET /jobs/{id} (status stream)", () => {
    it("refuses the upgrade for a job that was never started", async () => {
      const { messages, code, errored } = await streamStatus(base, "never-started");

      assert.equal(errored, true);
      assert.deepEqual(messages, []);
      assert.notEqual(code, 1000);
    });

    it("refuses that upgrade with a 404 problem body", async () => {
      await assertProblem(await upgradeRequest(base, "never-started"), 404);
    });

    it("answers a plain GET on a started job with a 426 problem", async () => {
      await postJob(base, "plain-get");

      await assertProblem(await fetch(`${base}/jobs/plain-get`), 426);
    });

    it("sends log messages, then exactly one done with the scripted proven and status, then closes normally", async () => {
      await postJob(base, "streamed");

      const { messages, code } = await streamStatus(base, "streamed");

      assert.equal(code, 1000);
      const logs = messages.slice(0, -1);
      assert.ok(logs.length >= 1, "at least one log message before done");
      for (const log of logs) {
        assert.equal(log.type, "log");
        assert.equal(typeof log.message, "string");
        assert.ok(log.message.length > 0);
      }
      const done = messages.at(-1);
      assert.equal(done.type, "done");
      assert.equal(done.proven, true);
      assert.equal(typeof done.status, "string");
      assert.ok(done.status.length > 0, "the whole run's Verifier Status travels with done");
    });

    it("sends the same sequence for every job", async () => {
      await postJob(base, "first");
      await postJob(base, "second");

      const first = await streamStatus(base, "first");
      const second = await streamStatus(base, "second");

      assert.deepEqual(first.messages, second.messages);
    });
  });

  describe("GET /jobs/{id}/result after done", () => {
    it("maps every statement id of the program to a proven result with a status text", async () => {
      await postJob(base, "finished");
      await streamStatus(base, "finished");

      const response = await fetch(`${base}/jobs/finished/result`);

      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /^application\/json/);
      const result = await response.json();
      assert.deepEqual(Object.keys(result).sort(), ["0", "1", "2", "3", "4", "5"]);
      for (const entry of Object.values(result)) {
        assert.equal(entry.proven, true);
        assert.equal(typeof entry.status, "string");
        assert.ok(entry.status.length > 0);
      }
    });

    it("echoes the resolved settings it was started with in the status text, generically and sorted by id", async () => {
      const request = startRequest();
      request.settings = { zebra: "z", alpha: "a", flag: true };
      await postJob(base, "with-settings", request);
      await streamStatus(base, "with-settings");

      const result = await (await fetch(`${base}/jobs/with-settings/result`)).json();

      assert.equal(result["0"].status, "Mock verification passed (alpha=a, flag=true, zebra=z)");
    });

    it("fails the run and every statement when shouldPass is false", async () => {
      const request = startRequest();
      request.settings = { shouldPass: false };
      await postJob(base, "should-fail", request);

      const { messages } = await streamStatus(base, "should-fail");
      const result = await (await fetch(`${base}/jobs/should-fail/result`)).json();

      assert.equal(messages.at(-1).proven, false);
      for (const entry of Object.values(result)) {
        assert.equal(entry.proven, false);
        assert.equal(entry.status, "Mock verification failed (shouldPass=false)");
      }
    });
  });
});
