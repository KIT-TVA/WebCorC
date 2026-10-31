import { BehaviorSubject } from "rxjs";
import { SelectionStatementNode } from "./selection-statement-node";
import { SelectionStatement } from "../selection-statement";
import { Statement } from "../simple-statement";
import { Condition, ICondition } from "../../condition/condition";

describe("SelectionStatementNode verifier preconditions", () => {
  function selectionWithBranch(): SelectionStatementNode {
    const selection = new SelectionStatement(
      "sel",
      new Condition("pre"),
      new Condition("post"),
      [new Condition("g")],
      [new Statement("s", new Condition("pre && g"), new Condition("post"))],
      false,
    );
    return new SelectionStatementNode(selection, undefined);
  }

  it("gives a branch the selection's verifier precondition, whichever side touches it first", () => {
    const node = selectionWithBranch();
    const branch = node.children[0]!;

    branch.verifierPrecondition("mock");
    node.verifierPrecondition("mock").next(new Condition("x > 0"));

    expect(branch.verifierPrecondition("mock").getValue().condition).toBe("x > 0");
  });

  it("follows the new parent precondition after the selection is re-parented", () => {
    const node = selectionWithBranch();
    const branch = node.children[0]!;
    const parentPrecondition = new BehaviorSubject<ICondition>(new Condition("pre"));

    node.overridePrecondition(parentPrecondition);
    node.verifierPrecondition("mock").next(new Condition("y < 1"));

    expect(branch.verifierPrecondition("mock").getValue().condition).toBe("y < 1");
  });
});
