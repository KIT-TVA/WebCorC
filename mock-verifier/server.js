// Container entrypoint: PORT (default 80) and MESSAGE_DELAY_MS (default 200) come from the environment.
import { startMockVerifier } from "./mock-verifier.js";

const port = Number(process.env.PORT ?? 80);
const messageDelayMs = Number(process.env.MESSAGE_DELAY_MS ?? 200);

const server = await startMockVerifier({ port, messageDelayMs });
console.log(`mock Verifier listening on port ${server.port}`);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close().then(() => process.exit(0)));
}
