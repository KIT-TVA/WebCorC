/**
 * One message on a verification job's WebSocket (`/ws/verify/{jobId}`), discriminated by
 * `type`. Mirrors the backend's typed envelope
 * (`openapi/schema/verification/message.yml`): a free-text log line tagged with which
 * Verifier — or functional verification ({@link FUNCTIONAL_VERIFIER_ID}) — produced it, or
 * carrying no tag at all when the line is about the job's own orchestration rather than any
 * Verifier's output; one `done` per Verifier as it finishes (carrying that Verifier's
 * aggregate `proven` verdict); and one final `complete` once everything has, which is the
 * signal to fetch the job's result and close the socket.
 */
export type VerificationMessage = LogMessage | DoneMessage | CompleteMessage;

export interface LogMessage {
  type: "log";
  /** Absent when the line is about the job's own orchestration, not any Verifier's output. */
  verifier?: string;
  message: string;
}

export interface DoneMessage {
  type: "done";
  verifier: string;
  proven: boolean;
  /** Wall-clock run time of that Verifier (or functional verification), in milliseconds. */
  durationMs: number;
}

export interface CompleteMessage {
  type: "complete";
  /** Wall-clock time from the start of the job's run until complete was sent, in milliseconds. */
  durationMs: number;
}
