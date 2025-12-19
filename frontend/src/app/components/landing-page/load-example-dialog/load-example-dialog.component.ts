import {Component} from "@angular/core";
import {ApiDiagrammFile, ApiDirectory} from "../../../services/project/types/api-elements";
import {Listbox} from "primeng/listbox";
import {Button} from "primeng/button";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {Condition} from "../../../types/condition/condition";
import {CBCFormula} from "../../../types/CBCFormula";
import {Position} from "../../../types/position";
import {FormsModule} from "@angular/forms";
import {ProjectService} from "../../../services/project/project.service";
import {Statement} from "../../../types/statements/simple-statement";
import {RepetitionStatement} from "../../../types/statements/repetition-statement";
import {RootStatement} from "../../../types/statements/root-statement";
import {CompositionStatement} from "../../../types/statements/composition-statement";
import {SelectionStatement} from "../../../types/statements/selection-statement";
import {JavaVariable} from "../../../types/JavaVariable";

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
    project: ApiDirectory;
  } | null = null;

    constructor(
        public ref: DynamicDialogRef,
        public config: DynamicDialogConfig,
        public projectService: ProjectService,
    ) {
    }

    public readonly EXAMPLE_PROGRAMS: { name: string; icon: string; project: ApiDirectory }[] = [
        {
            name: "SimpleAddition",
            icon: "exposure_plus_1",
            project: new ApiDirectory("/", [
                new ApiDiagrammFile(
                    "simpleAddition.diagram",
                    new CBCFormula(
                        "SimpleAddition",
                        new RootStatement(
                            "Root",
                            new Condition("i > 7"),
                            new Condition("i > 8"),
                            new Statement(
                                "Statement",
                                new Condition("i > 7"),
                                new Condition("i > 8"),
                                "i = i + 1",
                                new Position(0, 400)
                            ),
                            new Position(0, 0)
                        ),
                        undefined,
                        undefined,
                        [new JavaVariable(
                            "int i;",
                            "LOCAL"
                        )],
                    ),
                ),
            ]),
        }

        ,
        {
            name: "LinearSearch",
            icon: "manage_search",
            project:
                new ApiDirectory("/", [
                    new ApiDiagrammFile(
                        "linearSearch.diagram",
                        new CBCFormula(
                            "LinearSearch",
                            new RootStatement(
                                "Root",
                                new Condition("appears(A, x, 0, A.length)"),
                                new Condition("A[i] = x"),
                                new CompositionStatement(
                                    "Comp",
                                    new Condition("appears(A, x, 0, A.length)"),
                                    new Condition("A[i] = x"),
                                    new Condition("appears(A, x, 0, A.length) & i = A.length-1"),
                                    new Statement(
                                        "Statement",
                                        new Condition("appears(A, x, 0, A.length)"),
                                        new Condition("appears(A, x, 0, A.length)"),
                                        "i = A.length-1;",
                                        new Position(0, 800)
                                    ),
                                    new RepetitionStatement(
                                        "Repetition",
                                        new Condition("appears(A, x, 0, A.length)"),
                                        new Condition("A[i] = x"),
                                        new Statement(
                                            "Statement2",
                                            new Condition("!appears(A, x, 0, A.length)"),
                                            new Condition("!appears(A, x, 0, A.length)"),
                                            "i = i-1;",
                                            new Position(0, 1600)
                                        ),
                                        new Condition("!appears(A, x, i+1, A.length)"),
                                        new Condition("i"),
                                        new Condition("A[i] != x"),
                                        false,
                                        false,
                                        false,
                                        new Position(0, 1200)
                                    ),
                                    new Position(0, 400)
                                ),
                                new Position(0, 0)
                            ),
                            undefined,
                            undefined,
                            [
                                new JavaVariable(
                                    "int i;",
                                    "LOCAL"
                                ),
                                new JavaVariable(
                                    "int x;",
                                    "LOCAL"
                                ),
                                new JavaVariable(
                                    "int[] A;",
                                    "LOCAL"
                                )
                            ]
                        ),
                    ),
                ]),
        }
        ,
        {
            name: "DutchFlag",
            icon: "flag",
            project:
                new ApiDirectory("/", [
                    new ApiDiagrammFile(
                        "dutchFlag.diagram",
                        new CBCFormula(
                            "DutchFlag",
                            new RootStatement(
                                "Root",
                                new Condition("s(A, 0, 0, A.length)"),
                                new Condition("s(A, wb, wt, bb) & wt = bb"),
                                new CompositionStatement(
                                    "Comp",
                                    new Condition("s(A, wb, wt, bb)"),
                                    new Condition("s(A, wb, wt, bb) & wt = bb"),
                                    new Condition("s(A, wb, wt, bb)"),
                                    new Statement(
                                        "Statement2",
                                        new Condition("s(A, 0, 0, A.length)"),
                                        new Condition("s(A, wb, wt, bb)"),
                                        "wb = 0; wt = 0; bb = A.length;",
                                        new Position(0, 1200)
                                    ),
                                    new RepetitionStatement(
                                        "Repetition",
                                        new Condition("s(A, wb, wt, bb)"),
                                        new Condition("s(A, wb, wt, bb) & wt = bb"),
                                        new SelectionStatement(
                                            "Selection",
                                            new Condition("(s(A, wb, wt, bb)) & (wt != bb)"),
                                            new Condition("s(A, wb, wt, bb)"),
                                            [
                                                new Condition(""),
                                                new Condition("A[wt] = 1"),
                                                new Condition("A[wt] = 2"),
                                            ],
                                            [
                                                new Statement(
                                                    "Statement3",
                                                    new Condition("((s(A, wb, wt, bb)) & (wt != bb)) & (A[wt] = 0)"),
                                                    new Condition("s(A, wb, wt, bb)"),
                                                    "t = A[wt]; A[wt] = A[wb]; A[wb] = t; wt = wt+1; wb = wb+1;",
                                                    new Position(0, 1800)
                                                ),
                                                new Statement(
                                                    "Statement4",
                                                    new Condition("((s(A, wb, wt, bb)) & (wt != bb)) & (A[wt] = 0)"),
                                                    new Condition("s(A, wb, wt, bb)"),
                                                    "wt = wt+1;",
                                                    new Position(800, 1800)
                                                ),
                                                new Statement(
                                                    "Statement5",
                                                    new Condition("((s(A, wb, wt, bb)) & (wt != bb)) & (A[wt] = 0)"),
                                                    new Condition("s(A, wb, wt, bb)"),
                                                    "t = A[wt]; A[wt] = A[bb-1]; A[bb-1] = t; bb = bb-1;",
                                                    new Position(1600, 1800)
                                                ),
                                            ],
                                            false,
                                            new Position(800, 1200)
                                        ),
                                        new Condition("s(A, wb, wt, bb)"),
                                        new Condition("wt != bb"),
                                        new Condition("bb-wt"),
                                        false,
                                        false,
                                        false,
                                        new Position(0, 800)
                                    ),
                                    new Position(0, 400)
                                ),
                                new Position(0, 0)
                            ),
                            undefined,
                            undefined,
                            [
                                new JavaVariable(
                                    "int[] A;",
                                    "LOCAL"
                                ),
                                new JavaVariable(
                                    "int t;",
                                    "LOCAL"
                                ),
                                new JavaVariable(
                                    "int wt;",
                                    "LOCAL"
                                ),
                                new JavaVariable(
                                    "int wb;",
                                    "LOCAL"
                                ),
                                new JavaVariable(
                                    "int bb",
                                    "LOCAL"
                                ),
                            ]
                        ),
                    ),
                ]),
        }
        ,
        {
            name: "MaxElement",
            icon: "trending_up",
            project:
                new ApiDirectory("/", [
                    new ApiDiagrammFile(
                        "maxElement.diagram",
                        new CBCFormula(
                            "MaxElement",
                            new RootStatement(
                                "Root",
                                new Condition("A.length > 0"),
                                new Condition("max(A, 0, A.length, i)"),
                                new CompositionStatement(
                                    "Comp1",
                                    new Condition("A.length > 0"),
                                    new Condition("max(A, 0, A.length, i)"),
                                    new Condition("A.length > 0 & i = 0 & j = 1"),
                                    new CompositionStatement(
                                        "Comp2",
                                        new Condition("A.length > 0"),
                                        new Condition("A.length > 0 & i = 0 & j = 1"),
                                        new Condition("A.length > 0 & i = 0"),
                                        new Statement(
                                            "Statement1",
                                            new Condition("A.length > 0"),
                                            new Condition("A.length > 0 & i = 0"),
                                            "i = 0;",
                                            new Position(800, 1200)
                                        ),
                                        new Statement(
                                            "Statement2",
                                            new Condition("A.length > 0 & i = 0"),
                                            new Condition("A.length > 0 & i = 0 & j = 1"),
                                            "j = 1;",
                                            new Position(1600, 1200)
                                        ),
                                        new Position(1300, 800)
                                    ),
                                    new RepetitionStatement(
                                        "Repetition",
                                        new Condition("A.length > 0 & i = 0 & j = 1"),
                                        new Condition("max(A, 0, A.length, i)"),
                                        new CompositionStatement(
                                            "Comp2",
                                            new Condition("(max(A, 0, j, i)) & (j != A.length)"),
                                            new Condition("max(A, 0, j, i)"),
                                            new Condition("max(A, 0, j+1, i)"),
                                            new SelectionStatement(
                                                "Selection",
                                                new Condition("(max(A, 0, j, i)) & (j != A.length)"),
                                                new Condition("max(A, 0, j+1, i)"),
                                                [
                                                    new Condition(""),
                                                    new Condition("s(A, wb, wt, bb)"),
                                                ],
                                                [
                                                    new Statement(
                                                        "Statement3",
                                                        new Condition("((max(A, 0, j, i)) & (j != A.length)) & (A[j] > A[i])"),
                                                        new Condition("max(A, 0, j+1, i)"),
                                                        "i = j;",
                                                        new Position(0, 2000)
                                                    ),
                                                    new Statement(
                                                        "Statement4",
                                                        new Condition("((max(A, 0, j, i)) & (j != A.length)) & (A[j] > A[i])"),
                                                        new Condition("max(A, 0, j+1, i)"),
                                                        ";",
                                                        new Position(800, 2000)
                                                    )
                                                ],
                                                false,
                                                new Position(800, 1600)
                                            ),
                                            new Statement(
                                                "Statement5",
                                                new Condition("max(A, 0, j+1, i)"),
                                                new Condition("max(A, 0, j, i)"),
                                                "j = j+1;",
                                                new Position(0, 1600)
                                            ),
                                            new Position(0, 1200)
                                        ),
                                        new Condition("max(A, 0, j, i)"),
                                        new Condition("A.length - j"),
                                        new Condition("j != A.length"),
                                        false,
                                        false,
                                        false,
                                        new Position(0, 800)
                                    ),
                                    new Position(0, 400)
                                ),
                                new Position(0, 0)
                            ),
                            undefined,
                            undefined,
                            [
                                new JavaVariable(
                                    "int j;",
                                    "LOCAL"
                                ),
                                new JavaVariable(
                                    "int i;",
                                    "LOCAL"
                                ),
                                new JavaVariable(
                                    "int[] A;",
                                    "LOCAL"
                                ),
                            ]
                        ),
                    ),
                ]),
        }
        ,
    ]
    ;
}
