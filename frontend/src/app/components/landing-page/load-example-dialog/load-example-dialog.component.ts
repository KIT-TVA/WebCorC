import { Component } from "@angular/core";
import {
  LocalDiagramFile,
  LocalDirectory,
  LocalTextFile,
} from "../../../services/project/types/api-elements";
import { Listbox } from "primeng/listbox";
import { Button } from "primeng/button";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { Condition } from "../../../types/condition/condition";
import { LocalCBCFormula } from "../../../types/CBCFormula";
import { Position } from "../../../types/position";
import { FormsModule } from "@angular/forms";
import { ProjectService } from "../../../services/project/project.service";
import { Statement } from "../../../types/statements/simple-statement";
import { RepetitionStatement } from "../../../types/statements/repetition-statement";
import { RootStatement } from "../../../types/statements/root-statement";
import { CompositionStatement } from "../../../types/statements/composition-statement";
import { SelectionStatement } from "../../../types/statements/selection-statement";
import { JavaVariable } from "../../../types/JavaVariable";
import { SkipStatement } from "../../../types/statements/strong-weak-statement";

@Component({
  selector: "app-load-example-dialog",
  imports: [Listbox, Button, FormsModule],
  templateUrl: "./load-example-dialog.component.html",
  styleUrl: "./load-example-dialog.component.scss",
  standalone: true,
})
export class LoadExampleDialogComponent {
  selectedExample: {
    name: string;
    icon: string;
    project: LocalDirectory;
  } | null = null;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    public projectService: ProjectService,
  ) {}

  public readonly EXAMPLE_PROGRAMS: {
    name: string;
    icon: string;
    project: LocalDirectory;
  }[] = [
    {
      name: "SimpleAddition",
      icon: "exposure_plus_1",
      project: new LocalDirectory("", [
        new LocalDiagramFile(
          "simpleAddition.diagram",
          new LocalCBCFormula(
            "SimpleAddition",
            new RootStatement(
              "Root",
              new Condition("i > 7"),
              new Condition("i > 8"),
              new Statement(
                "Statement",
                new Condition("i > 7"),
                new Condition("i > 8"),
                "i = i + 1;",
                new Position(0, 400),
              ),
              new Position(0, 0),
            ),
            [new JavaVariable("int i", "LOCAL")],
          ),
        ),
      ]),
    },
    {
      name: "LinearSearch",
      icon: "manage_search",
      project: new LocalDirectory("", [
        new LocalDiagramFile(
          "linearSearch.diagram",
          new LocalCBCFormula(
            "LinearSearch",
            new RootStatement(
              "Root",
              new Condition("appears(A, x, 0, A.length)"),
              new Condition("A[i] == x"),
              new CompositionStatement(
                "Comp",
                new Condition("appears(A, x, 0, A.length)"),
                new Condition("A[i] == x"),
                new Condition("appears(A, x, 0, A.length) && i == A.length-1"),
                new Statement(
                  "Statement",
                  new Condition("appears(A, x, 0, A.length)"),
                  new Condition(
                    "appears(A, x, 0, A.length) && i == A.length-1",
                  ),
                  "i = A.length-1;",
                  new Position(0, 800),
                ),
                new RepetitionStatement(
                  "Repetition",
                  new Condition("!appears(A,x,i+1,A.length) && (A[i] != x)"),
                  new Condition("A[i]==x"),
                  new Statement(
                    "Statement2",
                    new Condition("!appears(A,x,i+1,A.length) && (A[i] != x)"),
                    new Condition("!appears(A,x,i+1,A.length)"),
                    "i = i-1;",
                    new Position(0, 1600),
                  ),
                  new Condition("i"),
                  new Condition("!appears(A, x, i+1, A.length)"),
                  new Condition("(A[i] != x)"),
                  false,
                  false,
                  false,
                  new Position(0, 1200),
                ),
                new Position(0, 400),
              ),
              new Position(0, 0),
            ),
            [
              new JavaVariable("int i", "LOCAL"),
              new JavaVariable("int x", "LOCAL"),
              new JavaVariable("int[] A", "LOCAL"),
            ],
            [
              new Condition("A != null"),
              new Condition("i >= 0 && i < A.length"),
              new Condition("A.length > 0"),
              new Condition("A.length < 10"),
              new Condition("appears(A,x,0,A.length)"),
            ],
          ),
          "file",
        ),
        new LocalDirectory("include", [
          new LocalTextFile(
            "include/predicates.key",
            "\\predicates {\n" +
              "    appears(int[], int, int, int);\n" +
              "}\n" +
              "\n" +
              "\\rules {\n" +
              "    appears {\n" +
              "        \\schemaVar \\term int[] A;\n" +
              "        \\schemaVar \\term int x;\n" +
              "        \\schemaVar \\term int start;\n" +
              "        \\schemaVar \\term int end;\n" +
              "        \\schemaVar \\variable int q;\n" +
              "        \\find (appears(A, x, start, end))\n" +
              "        \\varcond (\\notFreeIn(q,A), \\notFreeIn(q,x), \\notFreeIn(q,start), \\notFreeIn(q,end))\n" +
              "        \\replacewith (\\exists int q; (q >= start & q < end & A[q]=x))\n" +
              "        \\heuristics(simplify)\n" +
              "    };\n" +
              "}\n",
          ),
        ]),
      ]),
    },
    {
      name: "MaxElement",
      icon: "trending_up",
      project: new LocalDirectory("", [
        new LocalDiagramFile(
          "maxElement.diagram",
          new LocalCBCFormula(
            "MaxElement",
            new RootStatement(
              "Root",
              new Condition("A.length > 0"),
              new Condition("maxe(A, 0, A.length, i)"),
              new CompositionStatement(
                "Comp1",
                new Condition("A.length > 0"),
                new Condition("maxe(A, 0, A.length, i)"),
                new Condition("A.length > 0 && i == 0 && j == 1"),
                new CompositionStatement(
                  "Comp2",
                  new Condition("A.length > 0"),
                  new Condition("A.length > 0 && i == 0 && j == 1"),
                  new Condition("A.length > 0 && i == 0"),
                  new Statement(
                    "Statement1",
                    new Condition("A.length > 0"),
                    new Condition("A.length > 0 && i == 0"),
                    "i = 0;",
                    new Position(0, 1200),
                  ),
                  new Statement(
                    "Statement2",
                    new Condition("A.length > 0 && i == 0"),
                    new Condition("A.length > 0 && i == 0 && j == 1"),
                    "j = 1;",
                    new Position(825, 1200),
                  ),
                  new Position(0, 800),
                ),
                new RepetitionStatement(
                  "Repetition",
                  new Condition("maxe(A,0,j,i) && (j!=A.length)"),
                  new Condition("maxe(A,0,j,i)"),
                  new CompositionStatement(
                    "CompLoop",
                    new Condition("maxe(A,0,j,i) && (j!=A.length)"),
                    new Condition("maxe(A,0,j,i)"),
                    new Condition("maxe(A,0,j+1,i)"),
                    new SelectionStatement(
                      "Selection",
                      new Condition("maxe(A,0,j,i) && (j!=A.length)"),
                      new Condition("maxe(A,0,j+1,i)"),
                      [
                        new Condition("A[j] > A[i]"),
                        new Condition("A[j] <= A[i]"),
                      ],
                      [
                        new Statement(
                          "Statement3",
                          new Condition(
                            "maxe(A,0,j,i) && (j!=A.length) && A[j] > A[i]",
                          ),
                          new Condition("maxe(A,0,j+1,i)"),
                          "i = j;",
                          new Position(600, 2000),
                        ),
                        new SkipStatement(
                          "Statement4",
                          new Condition(
                            "maxe(A,0,j,i) && (j!=A.length) && A[j] <= A[i]",
                          ),
                          new Condition("maxe(A,0,j+1,i)"),
                          new Position(0, 2000),
                        ),
                      ],
                      false,
                      new Position(0, 1575),
                    ),
                    new Statement(
                      "Statement5",
                      new Condition("maxe(A,0,j+1,i)"),
                      new Condition("maxe(A,0,j,i)"),
                      "j = j + 1;",
                      new Position(1650, 1600),
                    ),
                    new Position(1650, 1200),
                  ),
                  new Condition("A.length - j"),
                  new Condition("maxe(A,0,j,i)"),
                  new Condition("j != A.length"),
                  false,
                  false,
                  false,
                  new Position(825, 800),
                ),
                new Position(0, 400),
              ),
              new Position(0, 0),
            ),
            [
              new JavaVariable("int j", "LOCAL"),
              new JavaVariable("int i", "LOCAL"),
              new JavaVariable("int[] A", "LOCAL"),
            ],
            [
              new Condition("A != null"),
              new Condition("A.length > 0"),
              new Condition("A.length < 10"),
              new Condition("i >= 0 && i < A.length"),
              new Condition("j >= 0 && j <= A.length"),
            ],
          ),
        ),
        new LocalDirectory("include", [
          new LocalTextFile(
            "include/predicates.key",
            "\\predicates {\n" +
              "    maxe(int[], int, int, int);\n" +
              "}\n" +
              "\n" +
              "\\rules {\n" +
              "    maxe {\n" +
              "        \\schemaVar \\term int[] A;\n" +
              "        \\schemaVar \\term int begin;\n" +
              "        \\schemaVar \\term int end;\n" +
              "        \\schemaVar \\term int m;\n" +
              "        \\schemaVar \\variable int q;\n" +
              "        \\find (maxe(A, begin, end, m))\n" +
              "        \\varcond (\\notFreeIn(q,A), \\notFreeIn(q,begin), \\notFreeIn(q,end), \\notFreeIn(q,m))\n" +
              "        \\replacewith (\\forall int q; ((q >= begin & q < end) -> A[m]>=A[q]))\n" +
              "        \\heuristics(simplify)\n" +
              "    };\n" +
              "}\n",
          ),
        ]),
      ]),
    },
    {
      name: "Transaction",
      icon: "account_balance",
      project: new LocalDirectory("", [
        new LocalDiagramFile(
          "transaction.diagram",
          new LocalCBCFormula(
            "Transaction",
            new RootStatement(
              "Root",
              new Condition("true"),
              new Condition(
                "(\\old(balance) + x >= limit ==> balance == \\old(balance) + x) && " +
                  "(\\old(balance) + x < limit ==> balance == \\old(balance))",
              ),
              new CompositionStatement(
                "Comp1",
                new Condition("true"),
                new Condition(
                  "(\\old(balance) + x >= limit ==> balance == \\old(balance) + x) && " +
                    "(\\old(balance) + x < limit ==> balance == \\old(balance))",
                ),
                new Condition("newBalance == balance + x"),
                new Statement(
                  "Statement1",
                  new Condition("true"),
                  new Condition("newBalance == balance + x"),
                  "newBalance = balance + x;",
                  new Position(0, 975),
                ),
                new SelectionStatement(
                  "Selection",
                  new Condition("newBalance == balance + x"),
                  new Condition(
                    "(\\old(balance) + x >= limit ==> balance == \\old(balance) + x) && " +
                      "(\\old(balance) + x < limit ==> balance == \\old(balance))",
                  ),
                  [
                    new Condition("newBalance >= limit"),
                    new Condition("newBalance < limit"),
                  ],
                  [
                    new Statement(
                      "Statement3",
                      new Condition(
                        "newBalance == balance + x && newBalance >= limit",
                      ),
                      new Condition(
                        "(\\old(balance) + x >= limit ==> balance == \\old(balance) + x) && " +
                          "(\\old(balance) + x < limit ==> balance == \\old(balance))",
                      ),
                      "balance = newBalance;",
                      new Position(350, 1400),
                    ),
                    new SkipStatement(
                      "Statement4",
                      new Condition(
                        "newBalance == balance + x && newBalance < limit",
                      ),
                      new Condition(
                        "(\\old(balance) + x >= limit ==> balance == \\old(balance) + x) && " +
                          "(\\old(balance) + x < limit ==> balance == \\old(balance))",
                      ),
                      new Position(1225, 1400),
                    ),
                  ],
                  false,
                  new Position(825, 975),
                ),
                new Position(0, 400),
              ),
              new Position(0, 0),
            ),
            [
              new JavaVariable("int limit", "LOCAL"),
              new JavaVariable("int newBalance", "LOCAL"),
              new JavaVariable("int x", "LOCAL"),
              new JavaVariable("int balance", "LOCAL"),
            ],
          ),
        ),
      ]),
    },
  ];
}
