import {Component} from "@angular/core";
import {ApiDiagrammFile, ApiDirectory, ApiTextFile,} from "../../../services/project/types/api-elements";
import {Listbox} from "primeng/listbox";
import {Button} from "primeng/button";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {JavaVariable} from "../../../types/JavaVariable";
import {Condition} from "../../../types/condition/condition";
import {Renaming} from "../../../types/Renaming";
import {CBCFormula} from "../../../types/CBCFormula";
import {Position} from "../../../types/position";
import {FormsModule} from "@angular/forms";
import {ProjectService} from "../../../services/project/project.service";

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
    ) {}

    public readonly EXAMPLE_PROGRAMS: { name: string; icon: string; project: ApiDirectory }[] = [
        {
            name: "SimpleAddition",
            icon: "exposure_plus_1",
            project: new ApiDirectory("/", [
                new ApiDiagrammFile(
                    "simpleAddition.diagram",
                    new CBCFormula(
                        "SimpleAddition",
                        {
                            id: "s1",
                            name: "i = i + 1;",
                            type: "STATEMENT",
                            preCondition: new Condition("i > 7"),
                            postCondition: new Condition("i > 8"),
                        },
                        new Condition("i > 7"), // CBCFormula pre
                        new Condition("i > 8"), // CBCFormula post
                        [new JavaVariable("int i", "LOCAL")],
                        [],
                        [],
                        false,
                        new Position(508, 10),
                    ),
                ),
            ]),
        },
        {
            name: "LinearSearch",
            icon: "manage_search",
            project: new ApiDirectory("/", [
                new ApiDiagrammFile(
                    "linearSearch.diagram",
                    new CBCFormula(
                        "LinearSearch",
                        {
                            id: "s2",
                            name: "Search for x in A",
                            type: "REPETITION",
                            preCondition: new Condition("i >= 0 & i < A.length"),
                            postCondition: new Condition("A[i] = x"),
                        },
                        new Condition("appears(A, x, 0, A.length)"),
                        new Condition("A[i] = x"),
                        [
                            new JavaVariable("int i", "LOCAL"),
                            new JavaVariable("int x", "LOCAL"),
                            new JavaVariable("int[] A", "LOCAL"),
                        ],
                        [
                            new Condition("A != null"),
                            new Condition("A.length > 0"),
                            new Condition("A.length < 10"),
                        ],
                        [new Renaming("bool", "app", "appears")],
                        true,
                    ),
                ),
            ]),
        },
        {
            name: "DutchFlag",
            icon: "flag",
            project: new ApiDirectory("/", [
                new ApiDiagrammFile(
                    "dutchFlag.diagram",
                    new CBCFormula(
                        "DutchFlag",
                        {
                            id: "s3",
                            name: "Dutch flag sorting loop",
                            type: "REPETITION",
                            preCondition: new Condition("s(A, 0, 0, A.length)"),
                            postCondition: new Condition("s(A, wb, wt, bb) & wt = bb"),
                        },
                        new Condition("s(A, 0, 0, A.length)"),
                        new Condition("s(A, wb, wt, bb) & wt = bb"),
                        [
                            new JavaVariable("int[] A", "LOCAL"),
                            new JavaVariable("int t", "LOCAL"),
                            new JavaVariable("int wt", "LOCAL"),
                            new JavaVariable("int wb", "LOCAL"),
                            new JavaVariable("int bb", "LOCAL"),
                        ],
                        [
                            new Condition("A != null"),
                            new Condition("A.length > 0"),
                            new Condition("0 <= wb & wb <= wt & wt <= bb & bb <= A.length"),
                        ],
                        null,
                        true,
                    ),
                ),
            ]),
        },
        {
            name: "MaxElement",
            icon: "trending_up",
            project: new ApiDirectory("/", [
                new ApiDiagrammFile(
                    "maxElement.diagram",
                    new CBCFormula(
                        "MaxElement",
                        {
                            id: "s4",
                            name: "Find maximum element loop",
                            type: "REPETITION",
                            preCondition: new Condition("A.length > 0"),
                            postCondition: new Condition("max(A, 0, A.length, i)"),
                        },
                        new Condition("A.length > 0"),
                        new Condition("max(A, 0, A.length, i)"),
                        [
                            new JavaVariable("int j", "LOCAL"),
                            new JavaVariable("int i", "LOCAL"),
                            new JavaVariable("int[] A", "LOCAL"),
                        ],
                        [
                            new Condition("A != null"),
                            new Condition("A.length > 0"),
                            new Condition("A.length < 10"),
                        ],
                        [new Renaming("int", "maxi", "max")],
                        true,
                    ),
                ),
            ]),
        },
    ];
}