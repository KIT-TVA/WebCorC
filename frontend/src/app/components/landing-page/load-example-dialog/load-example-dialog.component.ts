import {Component} from "@angular/core";
import {ApiDiagrammFile, ApiDirectory, ApiTextFile,} from "../../../services/project/types/api-elements";
import {Listbox} from "primeng/listbox";
import {Button} from "primeng/button";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {JavaVariable} from "../../../types/JavaVariable";
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

@Component({
    selector: "app-load-example-dialog",
    imports: [Listbox, Button, FormsModule],
    templateUrl: "./load-example-dialog.component.html",
    styleUrl: "./load-example-dialog.component.scss",
    standalone: true,
})
export class LoadExampleDialogComponent {
    selectedExample: { name: string; icon: string; project: ApiDirectory } | null = null;

    loadExample() {
        if (this.selectedExample) {
            console.log("Selected Example:", this.selectedExample.name);
            console.log("Project data:", this.selectedExample.project);
        } else {
            console.warn("No example selected!");
        }
    }

    private readonly helperfile = new ApiTextFile(
        "helper.key",
        String.raw`\predicates {
    app(int[], int, int, int);
    maxi(int[], int, int, int);
    sort(int[], int, int, int);
    s(int[], int, int, int);
    c(int[], int, int, int);
}

\rules {
    app{
       \schemaVar \term int[] A;
       \schemaVar \term int begin;
       \schemaVar \term int end;
       \schemaVar \term int search;
       \schemaVar \variable int q;
       \find (app(A, begin, end, search))
       \varcond (\notFreeIn(q, A), \notFreeIn(q, begin), \notFreeIn(q, end), \notFreeIn(q, search))
       \replacewith (\exists q; (q >= begin & q < end & A[q]=search))
       \heuristics(simplify)
    };

    maxi{
       \schemaVar \term int[] A;
       \schemaVar \term int begin;
       \schemaVar \term int end;
       \schemaVar \term int max;
       \schemaVar \variable int q;
       \find (maxi(A, begin, end, max))
       \varcond (\notFreeIn(q, A), \notFreeIn(q, begin), \notFreeIn(q, end), \notFreeIn(q, max))
       \replacewith (\forall q; ((q >= begin & q < end) -> A[max]>=A[q]))
       \heuristics(simplify)
    };

    sort{
       \schemaVar \term int[] A;
       \schemaVar \term int begin;
       \schemaVar \term int end;
       \schemaVar \term int max;
       \schemaVar \variable int q;
       \find (sort(A, begin, end, max))
       \varcond (\notFreeIn(q, A), \notFreeIn(q, begin), \notFreeIn(q, end), \notFreeIn(q, max))
       \replacewith (\forall q; ((q >= 1 & q < length(A)) -> A[q-1]<=A[q]))
       \heuristics(simplify)
    };

    s{
       \schemaVar \term int[] A;
       \schemaVar \term int wb;
       \schemaVar \term int wt;
       \schemaVar \term int bb;
       \find (s(A, wb, wt, bb))
       \replacewith (c(A,0,wb,0) & c(A,wb,wt,1) & c(A,bb,length(A),2) & 0<=wb & wb<=wt & wt<=bb & bb<=length(A))
       \heuristics(simplify)
    };

    c{
       \schemaVar \term int[] A;
       \schemaVar \term int l;
       \schemaVar \term int h;
       \schemaVar \term int s;
       \schemaVar \variable int q;
       \find (c(A, l, h, s))
       \varcond (\notFreeIn(q, A), \notFreeIn(q, l), \notFreeIn(q, h), \notFreeIn(q, s))
       \replacewith ((\forall q; ((q >= l & q < h) -> A[q]=s)))
       \heuristics(simplify)
    };
}`)

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
                                new Position(300, 300)
                            ),
                            new Position(0, 0)
                        ),
                    ),
                ),
            ]),
        }

        ,
        {
            name: "LinearSearch",
            icon:
                "manage_search",
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
                                        "i = A.length-1;"
                                    ),
                                    new RepetitionStatement(
                                        "Repetition",
                                        new Condition("appears(A, x, 0, A.length)"),
                                        new Condition("A[i] = x"),
                                        new Statement(
                                            "Statement2",
                                            new Condition("!appears(A, x, 0, A.length)"),
                                            new Condition("!appears(A, x, 0, A.length)"),
                                            "i = i-1;"
                                        ),
                                        new Condition("!appears(A, x, i+1, A.length)"),
                                        new Condition("i"),
                                        new Condition("A[i] != x"),
                                        false,
                                        false,
                                        false,
                                    )
                                )
                            ),
                        ),
                    ),
                ]),
        }
        ,
        {
            name: "DutchFlag",
            icon:
                "flag",
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
                                                    "t = A[wt]; A[wt] = A[wb]; A[wb] = t; wt = wt+1; wb = wb+1;"
                                                ),
                                                new Statement(
                                                    "Statement4",
                                                    new Condition("((s(A, wb, wt, bb)) & (wt != bb)) & (A[wt] = 0)"),
                                                    new Condition("s(A, wb, wt, bb)"),
                                                    "wt = wt+1;"
                                                ),
                                                new Statement(
                                                    "Statement5",
                                                    new Condition("((s(A, wb, wt, bb)) & (wt != bb)) & (A[wt] = 0)"),
                                                    new Condition("s(A, wb, wt, bb)"),
                                                    "t = A[wt]; A[wt] = A[bb-1]; A[bb-1] = t; bb = bb-1;"
                                                ),
                                            ],
                                            false,
                                        ),
                                        new Condition("s(A, wb, wt, bb)"),
                                        new Condition("wt != bb"),
                                        new Condition("bb-wt"),
                                        false,
                                        false,
                                        false,
                                    ),
                                ),
                            )
                        ),
                    ),
                ]),
        }
        ,
        {
            name: "MaxElement",
            icon:
                "trending_up",
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
                                            "i = 0;"
                                        ),
                                        new Statement(
                                            "Statement2",
                                            new Condition("A.length > 0 & i = 0"),
                                            new Condition("A.length > 0 & i = 0 & j = 1"),
                                            "j = 1;"
                                        )
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
                                                [new Statement(
                                                    "Statement3",
                                                    new Condition("((max(A, 0, j, i)) & (j != A.length)) & (A[j] > A[i])"),
                                                    new Condition("max(A, 0, j+1, i)"),
                                                    "i = j;",
                                                ),
                                                    new Statement(
                                                        "Statement4",
                                                        new Condition("((max(A, 0, j, i)) & (j != A.length)) & (A[j] > A[i])"),
                                                        new Condition("max(A, 0, j+1, i)"),
                                                        ";",
                                                    ),
                                                ],
                                                false
                                            ),
                                            new Statement(
                                                "Statement5",
                                                new Condition("max(A, 0, j+1, i)"),
                                                new Condition("max(A, 0, j, i)"),
                                                "j = j+1;"
                                            )
                                        ),
                                        new Condition("max(A, 0, j, i)"),
                                        new Condition("A.length - j"),
                                        new Condition("j != A.length"),
                                        false,
                                        false,
                                        false,
                                    )
                                )
                            )
                        ),
                    ),
                ]),
        }
        ,
    ]
    ;
}