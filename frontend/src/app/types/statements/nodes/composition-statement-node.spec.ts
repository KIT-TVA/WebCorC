import { CompositionStatementNode } from "./composition-statement-node";
import { CompositionStatement } from "../composition-statement";
import { Condition } from "../../condition/condition";

describe("CompositionStatementNode.finalizeVerifierConditions", () => {
  it("keeps a result-only entry (no authored conditions, no intermediate condition) without crashing", () => {
    const composition = new CompositionStatement(
      "c",
      new Condition("true"),
      new Condition("true"),
      new Condition(""),
      undefined,
      undefined,
    );
    composition.verifiers = {
      mock: { proven: true, status: "ok" },
    };
    const node = new CompositionStatementNode(composition, undefined);

    expect(() => node.finalize()).not.toThrow();

    expect(composition.verifiers["mock"]).toEqual({ proven: true, status: "ok" });
  });

  it("writes only the live intermediate condition for a verifier with no pre/postcondition", () => {
    const composition = new CompositionStatement(
      "c",
      new Condition("true"),
      new Condition("true"),
      new Condition("mid"),
      undefined,
      undefined,
    );
    const node = new CompositionStatementNode(composition, undefined);

    node.verifierIntermediateCondition("energy").next(new Condition("mid2"));
    node.finalize();

    expect(composition.verifiers["energy"]).toEqual({
      intermediateCondition: new Condition("mid2"),
    });
  });

  it("preserves a stored result when the entry is rebuilt with a live intermediate condition", () => {
    const composition = new CompositionStatement(
      "c",
      new Condition("true"),
      new Condition("true"),
      new Condition("mid"),
      undefined,
      undefined,
    );
    composition.verifiers = {
      mock: {
        intermediateCondition: new Condition("mid"),
        proven: true,
        status: "ok",
      },
    };
    const node = new CompositionStatementNode(composition, undefined);

    node.verifierIntermediateCondition("mock").next(new Condition("mid2"));
    node.finalize();

    expect(composition.verifiers["mock"].intermediateCondition?.condition).toBe("mid2");
    expect(composition.verifiers["mock"].proven).toBe(true);
    expect(composition.verifiers["mock"].status).toBe("ok");
  });
});
