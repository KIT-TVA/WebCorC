import { parseVerificationMessage } from "./websocket";

describe("parseVerificationMessage", () => {
  it("parses a log envelope", () => {
    const parsed = parseVerificationMessage(
      '{"type":"log","verifier":"func","message":"verification started"}',
    );
    expect(parsed).toEqual({
      type: "log",
      verifier: "func",
      message: "verification started",
    });
  });

  it("parses a done envelope", () => {
    const parsed = parseVerificationMessage(
      '{"type":"done","verifier":"mock","proven":true,"durationMs":850}',
    );
    expect(parsed).toEqual({
      type: "done",
      verifier: "mock",
      proven: true,
      durationMs: 850,
    });
  });

  it("parses a complete envelope", () => {
    const parsed = parseVerificationMessage('{"type":"complete","durationMs":4200}');
    expect(parsed).toEqual({ type: "complete", durationMs: 4200 });
  });
});
