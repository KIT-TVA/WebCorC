import { SimpleStatementNode } from "./simple-statement-node";
import { Statement } from "../simple-statement";
import { Condition } from "../../condition/condition";

describe("AbstractStatementNode.finalizeVerifierConditions", () => {
  it("preserves a stored verifier result (proven/status) when the entry is rebuilt from an edited condition", () => {
    const statement = new Statement("s", new Condition("true"), new Condition("true"));
    statement.verifiers = {
      energy: {
        preCondition: new Condition("x > 0"),
        postCondition: new Condition("x > 1"),
        proven: true,
        status: "0.4 kWh",
      },
    };
    const node = new SimpleStatementNode(statement, undefined);

    // Touch the verifier's precondition slot so finalize() rebuilds this entry.
    node.verifierPrecondition("energy").next(new Condition("x > 2"));

    node.finalize();

    expect(statement.verifiers["energy"].preCondition?.condition).toBe("x > 2");
    expect(statement.verifiers["energy"].proven).toBe(true);
    expect(statement.verifiers["energy"].status).toBe("0.4 kWh");
  });

  it("keeps a result-only entry (no authored conditions) instead of dropping it as empty", () => {
    const statement = new Statement("s", new Condition("true"), new Condition("true"));
    statement.verifiers = {
      mock: { proven: false, status: "timed out" },
    };
    const node = new SimpleStatementNode(statement, undefined);

    // Touch the slot without ever giving the verifier a condition, so it is
    // rebuilt from an empty edited value while still carrying its result.
    node.verifierPrecondition("mock");

    node.finalize();

    expect(statement.verifiers["mock"].proven).toBe(false);
    expect(statement.verifiers["mock"].status).toBe("timed out");
    // The untouched empty slot must not turn into a `""` condition on the wire —
    // the backend rejects those, which made every second verify run a 400.
    expect(statement.verifiers["mock"].preCondition).toBeUndefined();
    expect(statement.verifiers["mock"].postCondition).toBeUndefined();
  });

  it("strips empty-string conditions from a stored entry it never touched", () => {
    const statement = new Statement("s", new Condition("true"), new Condition("true"));
    // Shape persisted by earlier builds: a result padded with empty conditions.
    statement.verifiers = {
      func: {
        preCondition: new Condition(""),
        postCondition: new Condition(""),
        proven: true,
      },
      stale: {
        preCondition: new Condition(""),
        postCondition: new Condition(""),
      },
    };
    const node = new SimpleStatementNode(statement, undefined);

    node.finalize();

    expect(statement.verifiers["func"]).toEqual({ proven: true });
    expect(statement.verifiers["stale"]).toBeUndefined();
  });

  it("keeps a partially authored entry sparse: only the non-empty condition is written", () => {
    const statement = new Statement("s", new Condition("true"), new Condition("true"));
    const node = new SimpleStatementNode(statement, undefined);

    node.verifierPostcondition("energy").next(new Condition("x > 1"));

    node.finalize();

    expect(statement.verifiers["energy"].preCondition).toBeUndefined();
    expect(statement.verifiers["energy"].postCondition?.condition).toBe("x > 1");
  });
});
