import { BehaviorSubject } from "rxjs";
import { RepetitionStatementNode } from "./repetition-statement-node";
import { RootStatementNode } from "./root-statement-node";
import { CompositionStatementNode } from "./composition-statement-node";
import { SelectionStatementNode } from "./selection-statement-node";
import { disconnectNodes } from "./statement-node-utils";
import { RepetitionStatement } from "../repetition-statement";
import { RootStatement } from "../root-statement";
import { CompositionStatement } from "../composition-statement";
import { SelectionStatement } from "../selection-statement";
import { Statement } from "../simple-statement";
import { Condition, ICondition } from "../../condition/condition";

describe("RepetitionStatementNode verifier conditions", () => {
  function repetition(): RepetitionStatement {
    return new RepetitionStatement(
      "rep",
      new Condition("inv && g"),
      new Condition("inv"),
      new Statement("body", new Condition("inv && g"), new Condition("inv")),
      new Condition("v"),
      new Condition("inv"),
      new Condition("g"),
      false,
      false,
      false,
    );
  }

  it("passes the parent's verifier pre/postconditions through to the loop body, leaving the functional ones derived", () => {
    const node = new RepetitionStatementNode(repetition(), undefined);
    const body = node.loopStatementNode!;
    const parentPre = new BehaviorSubject<ICondition>(new Condition("p"));
    const parentPost = new BehaviorSubject<ICondition>(new Condition("q"));
    const parent = new RootStatementNode(
      new RootStatement("root", new Condition("p"), new Condition("q"), undefined),
      undefined,
    );
    parent.overridePrecondition(parentPre);
    parent.overridePostcondition(parentPost);

    node.overridePrecondition(parentPre);
    node.overridePostcondition(parentPost);
    parent.verifierPrecondition("mock").next(new Condition("x > 0"));
    parent.verifierPostcondition("mock").next(new Condition("x > 1"));

    expect(body.verifierPrecondition("mock").getValue().condition).toBe("x > 0");
    expect(body.verifierPostcondition("mock").getValue().condition).toBe("x > 1");
    expect(node.precondition.getValue().condition).toBe("inv && g");
    expect(node.postcondition.getValue().condition).toBe("inv");
  });

  it("links to a root parent when the edges are checked after loading", () => {
    const root = new RootStatementNode(
      new RootStatement("root", new Condition("p"), new Condition("q"), repetition()),
      undefined,
    );
    const rep = root.childStatementNode as RepetitionStatementNode;

    root.checkConditionSync(rep);
    root.verifierPostcondition("mock").next(new Condition("done"));

    expect(rep.loopStatementNode!.verifierPostcondition("mock").getValue().condition).toBe("done");
  });

  it("links to the intermediate condition as the second statement of a composition", () => {
    const composition = new CompositionStatementNode(
      new CompositionStatement(
        "c",
        new Condition("p"),
        new Condition("q"),
        new Condition("mid"),
        new Statement("s", new Condition("p"), new Condition("mid")),
        repetition(),
      ),
      undefined,
    );
    const rep = composition.secondStatementNode as RepetitionStatementNode;

    composition.checkConditionSync(rep);
    composition.verifierIntermediateCondition("mock").next(new Condition("m"));
    composition.verifierPostcondition("mock").next(new Condition("r"));

    expect(rep.loopStatementNode!.verifierPrecondition("mock").getValue().condition).toBe("m");
    expect(rep.loopStatementNode!.verifierPostcondition("mock").getValue().condition).toBe("r");
  });

  it("gets the selection's verifier pre/postconditions as a selection branch", () => {
    const selection = new SelectionStatementNode(
      new SelectionStatement(
        "sel",
        new Condition("p"),
        new Condition("q"),
        [new Condition("h")],
        [repetition()],
        false,
      ),
      undefined,
    );
    const rep = selection.children[0] as RepetitionStatementNode;

    selection.checkConditionSync(rep);
    selection.verifierPrecondition("mock").next(new Condition("a"));
    selection.verifierPostcondition("mock").next(new Condition("b"));

    expect(rep.loopStatementNode!.verifierPrecondition("mock").getValue().condition).toBe("a");
    expect(rep.loopStatementNode!.verifierPostcondition("mock").getValue().condition).toBe("b");
  });

  it("keeps a detached copy of the verifier conditions when disconnected", () => {
    const root = new RootStatementNode(
      new RootStatement("root", new Condition("p"), new Condition("q"), repetition()),
      undefined,
    );
    const rep = root.childStatementNode as RepetitionStatementNode;
    root.checkConditionSync(rep);
    root.verifierPrecondition("mock").next(new Condition("x > 0"));

    disconnectNodes(root, rep);
    root.verifierPrecondition("mock").next(new Condition("changed"));

    expect(rep.verifierPrecondition("mock").getValue().condition).toBe("x > 0");
  });
});
