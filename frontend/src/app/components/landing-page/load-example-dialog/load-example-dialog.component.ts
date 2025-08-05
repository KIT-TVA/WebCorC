import {Component} from '@angular/core';

import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from '@angular/material/button';
import {MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle} from '@angular/material/dialog';
import { ApiDirectory, ApiTextFile} from '../../../services/project/types/api-elements';

@Component({
    selector: 'app-load-example-dialog',
    imports: [MatIconModule, MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
    templateUrl: './load-example-dialog.component.html',
    styleUrl: './load-example-dialog.component.scss'
})
export class LoadExampleDialogComponent {
    private readonly helperfile = new ApiTextFile("helper.key", String.raw`\predicates {
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
        //private readonly mapper : Mapper
    ) {
    }

    public readonly EXAMPLE_PROGRAMS: { name: string, icon: string, project: ApiDirectory }[] = []/*[

    {name: "SimpleAddition", icon: "exposure_plus_1", project: new ApiDirectory("/", [new ApiDiagrammFile("simpleAddition.diagram", JSON.parse('{"type":"CbCFormula","name":"/dutchFlag","proven":false,"comment":"","compositionTechnique":"CONTRACT_OVERRIDING","className":"","methodName":"","tested":false,"javaVariables":["int i"],"globalConditions":[],"preCondition":{"originId":1,"title":"Precondition","content":"i > 7"},"postCondition":{"originId":1,"title":"Postcondition","content":"i > 8"},"statement":{"name":"i = i + 1;","type":"AbstractStatement","id":2,"proven":false,"tested":false,"comment":"","preCondition":{"originId":2,"title":"Precondition","content":"i > 7"},"postCondition":{"originId":2,"title":"Postcondition","content":"i > 8"},"position":{"xinPx":684,"yinPx":51}},"renaming":[],"position":{"xinPx":508,"yinPx":10}}'))])},

    {name: "LinearSearch", icon: "manage_search", project: new ApiDirectory("/", [new ApiDiagrammFile("linearSearch.diagram", this.mapper.toCBCFormula(JSON.parse(String.raw`{"type":"CbCFormula","name":"LinearSearch","statement":{"name":"statement","refinement":{"type":"CompositionStatement","name":"compositionStatement","proven":true,"id":"70f4d1f3-c80a-4558-853f-699db80d8ab5","tested":false,"firstStatement":{"name":"statement1","refinement":{"name":"i = A.length-1;","postCondition":{"name":"appears(A, x, 0, A.length) & i = A.length-1","modifiables":["i"]},"preCondition":{"name":"appears(A, x, 0, A.length)"},"proven":true,"id":"49e58b54-816f-4524-8597-947ef5377b07","tested":false},"postCondition":{"name":"appears(A, x, 0, A.length) & i = A.length-1","modifiables":["i"]},"preCondition":{"name":"appears(A, x, 0, A.length)"},"proven":false,"id":"da7985d8-ed3c-4a78-ac58-b214cad3093e","tested":false},"secondStatement":{"name":"statement2","refinement":{"type":"SmallRepetitionStatement","name":"repetitionStatement","postCondition":{"name":"A[i] = x","modifiables":["i"]},"preCondition":{"name":"appears(A, x, 0, A.length) & i = A.length-1","modifiables":["i"]},"proven":true,"id":"44cbb6bd-1777-4715-b358-9aa16630a026","tested":false,"loopStatement":{"name":"loop","refinement":{"name":"i = i-1;","postCondition":{"name":"!appears(A, x, i+1, A.length)","modifiables":["i"]},"preCondition":{"name":"(!appears(A, x, i+1, A.length)) & (A[i] != x)","modifiables":["i"]},"proven":true,"id":"432c68bb-e8b1-4f1a-a964-4811a12821dd","tested":false},"postCondition":{"name":"!appears(A, x, i+1, A.length)","modifiables":["i"]},"preCondition":{"name":"(!appears(A, x, i+1, A.length)) & (A[i] != x)","modifiables":["i"]},"proven":false,"id":"bd49622a-e3d6-4159-94ce-f0fb5b1b6855","tested":false},"variant":{"name":"i"},"invariant":{"name":"!appears(A, x, i+1, A.length)"},"guard":{"name":"A[i] != x"},"variantProven":true,"preProven":true,"postProven":true},"postCondition":{"name":"A[i] = x","modifiables":["i"]},"preCondition":{"name":"appears(A, x, 0, A.length) & i = A.length-1","modifiables":["i"]},"proven":false,"id":"02a21f95-a1a3-46ec-b81e-d194a7634bca","tested":false},"intermediateCondition":{"name":"appears(A, x, 0, A.length) & i = A.length-1","modifiables":["i"]}},"postCondition":{"name":"A[i] = x","modifiables":["i"]},"preCondition":{"name":"appears(A, x, 0, A.length)"},"proven":false,"id":"588877e2-24cd-4784-ad14-f8e330b4e135","tested":false},"proven":true,"comment":"","compositionTechnique":"CONTRACT_OVERRIDING","className":"","methodName":"","tested":false,"javaVariables":{"type":"JavaVariables","variables":[{"name":"int i","kind":"LOCAL"},{"name":"int x","kind":"LOCAL"},{"name":"int[] A","kind":"LOCAL"}]},"globalConditions":{"type":"GlobalConditions","conditions":[{"name":"A != null"},{"name":"A.length > 0"},{"name":"A.length < 10"},{"name":"i >= 0 & i < A.length"},{"name":"appears(A, x, 0, A.length)"}]},"renaming":{"type":"Renaming","rename":[{"type":"bool","function":"app","newName":"appears"}]}}`) as EMFCbcFormula)), this.helperfile])},

    {name: "DutchFlag", icon: "flag", project: new ApiDirectory("/", [new ApiDiagrammFile("dutchFlag.diagram", this.mapper.toCBCFormula(JSON.parse('{"type":"CbCFormula","name":"DutchFlag","statement":{"name":"statement","refinement":{"type":"CompositionStatement","name":"compositionStatement","proven":true,"id":"89c9703b-8212-4a10-98ac-15415b1e6551","tested":false,"firstStatement":{"name":"statement1","refinement":{"name":"wb = 0; wt = 0; bb = A.length;","postCondition":{"name":"s(A, wb, wt, bb)","modifiables":["bb","wb","wt"]},"preCondition":{"name":"s(A, 0, 0, A.length)"},"proven":true,"id":"7a0a652e-1c05-45fa-9508-117e57b6e42d","tested":false},"postCondition":{"name":"s(A, wb, wt, bb)","modifiables":["bb","wb","wt"]},"preCondition":{"name":"s(A, 0, 0, A.length)"},"proven":false,"id":"700e90f8-0dcd-4ffc-a857-14b0d9e46b3d","tested":false},"secondStatement":{"name":"statement2","refinement":{"type":"SmallRepetitionStatement","name":"repetitionStatement","postCondition":{"name":"s(A, wb, wt, bb) & wt = bb","modifiables":["bb","wb","wt"]},"preCondition":{"name":"s(A, wb, wt, bb)","modifiables":["bb","wb","wt"]},"proven":true,"id":"b08d02df-e9ae-480d-9bfa-effed9ba46a5","tested":false,"loopStatement":{"name":"loop","refinement":{"type":"SelectionStatement","name":"selectionStatement","proven":true,"id":"f42f116a-7d24-4efd-a602-06b050535f86","tested":false,"guards":[{"name":"A[wt] = 0"},{"name":"A[wt] = 1"},{"name":"A[wt] = 2"}],"commands":[{"name":"statement","refinement":{"name":"t = A[wt]; A[wt] = A[wb]; A[wb] = t; wt = wt+1; wb = wb+1;","postCondition":{"name":"s(A, wb, wt, bb)","modifiables":["A[bb-1]","A[wt]","bb","t","wb","wt","A[wb]"]},"preCondition":{"name":"((s(A, wb, wt, bb)) & (wt != bb)) & (A[wt] = 0)","modifiables":["bb","wb","wt"]},"proven":true,"id":"7bbf8178-b459-427d-b2b6-998af29635c8","tested":false},"postCondition":{"name":"s(A, wb, wt, bb)","modifiables":["A[bb-1]","A[wt]","bb","t","wb","wt","A[wb]"]},"preCondition":{"name":"((s(A, wb, wt, bb)) & (wt != bb)) & (A[wt] = 0)","modifiables":["bb","wb","wt"]},"proven":false,"id":"48a22d5e-8d2e-4fb6-b69d-791e2f313bf6","tested":false},{"name":"statement","refinement":{"name":"wt = wt+1;","postCondition":{"name":"s(A, wb, wt, bb)","modifiables":["A[bb-1]","A[wt]","bb","t","wb","wt","A[wb]"]},"preCondition":{"name":"((s(A, wb, wt, bb)) & (wt != bb)) & (A[wt] = 1)","modifiables":["bb","wb","wt"]},"proven":true,"id":"eb36ac55-e482-49a8-8eeb-4ee5999a3e89","tested":false},"postCondition":{"name":"s(A, wb, wt, bb)","modifiables":["A[bb-1]","A[wt]","bb","t","wb","wt","A[wb]"]},"preCondition":{"name":"((s(A, wb, wt, bb)) & (wt != bb)) & (A[wt] = 1)","modifiables":["bb","wb","wt"]},"proven":false,"id":"b85d79ad-f910-409d-89de-af8ef588d8cb","tested":false},{"name":"statement","refinement":{"name":"t = A[wt]; A[wt] = A[bb-1]; A[bb-1] = t; bb = bb-1;","postCondition":{"name":"s(A, wb, wt, bb)","modifiables":["A[bb-1]","A[wt]","bb","t","wb","wt","A[wb]"]},"preCondition":{"name":"((s(A, wb, wt, bb)) & (wt != bb)) & (A[wt] = 2)","modifiables":["bb","wb","wt"]},"proven":true,"id":"d5600931-ca8a-4f0b-bb86-10d3fdd35206","tested":false},"postCondition":{"name":"s(A, wb, wt, bb)","modifiables":["A[bb-1]","A[wt]","bb","t","wb","wt","A[wb]"]},"preCondition":{"name":"((s(A, wb, wt, bb)) & (wt != bb)) & (A[wt] = 2)","modifiables":["bb","wb","wt"]},"proven":false,"id":"e56097b1-ae77-46eb-88c8-c510d7b3d226","tested":false}],"preProve":true},"postCondition":{"name":"s(A, wb, wt, bb)","modifiables":["A[bb-1]","A[wt]","bb","t","wb","wt","A[wb]"]},"preCondition":{"name":"(s(A, wb, wt, bb)) & (wt != bb)","modifiables":["bb","wb","wt"]},"proven":false,"id":"903ffeb0-a8db-4925-b71f-45a112b781f6","tested":false},"variant":{"name":"bb-wt"},"invariant":{"name":"s(A, wb, wt, bb)"},"guard":{"name":"wt != bb"},"variantProven":true,"preProven":true,"postProven":true},"postCondition":{"name":"s(A, wb, wt, bb) & wt = bb","modifiables":["A[bb-1]","A[wt]","bb","t","wb","wt","A[wb]"]},"preCondition":{"name":"s(A, wb, wt, bb)","modifiables":["bb","wb","wt"]},"proven":false,"id":"49948403-1f60-437e-a83a-356ad43beaf8","tested":false},"intermediateCondition":{"name":"s(A, wb, wt, bb)","modifiables":["bb","wb","wt"]}},"postCondition":{"name":"s(A, wb, wt, bb) & wt = bb","modifiables":["A[bb-1]","A[wt]","bb","t","wb","wt","A[wb]"]},"preCondition":{"name":"s(A, 0, 0, A.length)"},"proven":false,"id":"7638c0fa-bfab-4d53-850c-8a74034d01aa","tested":false},"proven":true,"comment":"","compositionTechnique":"CONTRACT_OVERRIDING","className":"","methodName":"","tested":false,"javaVariables":{"type":"JavaVariables","variables":[{"name":"int[] A","kind":"LOCAL"},{"name":"int t","kind":"LOCAL"},{"name":"int wt","kind":"LOCAL"},{"name":"int wb","kind":"LOCAL"},{"name":"int bb","kind":"LOCAL"}]},"globalConditions":{"type":"GlobalConditions","conditions":[{"name":"A != null"},{"name":"A.length > 0"},{"name":"0 <= wb & wb <= wt & wt <= bb & bb <= A.length"},{"name":"\\\\forall int i; ((i >= 0 & i < A.length) -> (A[i] = 0 | A[i] = 1 | A[i] = 2))"}]},"renaming":null}') as EMFCbcFormula)), this.helperfile])},

    {name: "MaxElement", icon: "trending_up", project: new ApiDirectory("/", [new ApiDiagrammFile("maxElement.diagram", this.mapper.toCBCFormula(JSON.parse(String.raw`{"type":"CbCFormula","name":"maxElement","statement":{"name":"statement","refinement":{"type":"CompositionStatement","name":"compositionStatement","proven":true,"id":"b4122bc0-db3e-41e6-8583-394f5f97dfef","tested":false,"firstStatement":{"name":"statement1","refinement":{"type":"CompositionStatement","name":"compositionStatement","proven":true,"id":"4999ab1f-c0e1-4cae-acda-f62f9d2d6043","tested":false,"firstStatement":{"name":"statement1","refinement":{"name":"i = 0;","postCondition":{"name":"A.length > 0 & i = 0","modifiables":["i"]},"preCondition":{"name":"A.length > 0"},"proven":true,"id":"5dea9071-b406-4a59-94fe-4aca14fe41f9","tested":false},"postCondition":{"name":"A.length > 0 & i = 0","modifiables":["i"]},"preCondition":{"name":"A.length > 0"},"proven":false,"id":"0239f7a5-54d7-4ac9-8077-14f7af8c5664","tested":false},"secondStatement":{"name":"statement2","refinement":{"name":"j = 1;","postCondition":{"name":"A.length > 0 & i = 0 & j = 1","modifiables":["i","j"]},"preCondition":{"name":"A.length > 0 & i = 0","modifiables":["i"]},"proven":true,"id":"96c3f533-8896-4201-97c0-43edc5cb0ba8","tested":false},"postCondition":{"name":"A.length > 0 & i = 0 & j = 1","modifiables":["i","j"]},"preCondition":{"name":"A.length > 0 & i = 0","modifiables":["i"]},"proven":false,"id":"9bb51eea-26e8-4ce6-bd53-a66c2c0fe13c","tested":false},"intermediateCondition":{"name":"A.length > 0 & i = 0","modifiables":["i"]}},"postCondition":{"name":"A.length > 0 & i = 0 & j = 1","modifiables":["i","j"]},"preCondition":{"name":"A.length > 0"},"proven":false,"id":"5c9e4602-b99c-431c-898e-e816068f8202","tested":false},"secondStatement":{"name":"statement2","refinement":{"type":"SmallRepetitionStatement","name":"repetitionStatement","postCondition":{"name":"max(A, 0, A.length, i)","modifiables":["i","j"]},"preCondition":{"name":"A.length > 0 & i = 0 & j = 1","modifiables":["i","j"]},"proven":true,"id":"18da35fc-368e-41f8-8521-c8aa52e74b45","tested":false,"loopStatement":{"name":"loop","refinement":{"type":"CompositionStatement","name":"compositionStatement","proven":true,"id":"12e1a845-7739-4422-9e13-7bb136ac22d0","tested":false,"firstStatement":{"name":"statement1","refinement":{"type":"SelectionStatement","name":"selectionStatement","proven":true,"id":"3d7dbf2c-6108-4834-bb38-d3207fbe671d","tested":false,"guards":[{"name":"A[j] > A[i]"},{"name":"A[j] <= A[i]"}],"commands":[{"name":"statement","refinement":{"name":"i = j;","postCondition":{"name":"max(A, 0, j+1, i)","modifiables":["i","j"]},"preCondition":{"name":"((max(A, 0, j, i)) & (j != A.length)) & (A[j] > A[i])","modifiables":["i","j"]},"proven":true,"id":"ddda60dd-57fd-4da0-aa9e-08b4cb7bb75a","tested":false},"postCondition":{"name":"max(A, 0, j+1, i)","modifiables":["i","j"]},"preCondition":{"name":"((max(A, 0, j, i)) & (j != A.length)) & (A[j] > A[i])","modifiables":["i","j"]},"proven":false,"id":"eb9a90ff-b4e7-4c65-98fa-8d2b8ccc3a0c","tested":false},{"name":"statement","refinement":{"name":";","postCondition":{"name":"max(A, 0, j+1, i)","modifiables":["i","j"]},"preCondition":{"name":"((max(A, 0, j, i)) & (j != A.length)) & (A[j] <= A[i])","modifiables":["i","j"]},"proven":true,"id":"542948eb-3277-4648-84a1-10aa21959227","tested":false},"postCondition":{"name":"max(A, 0, j+1, i)","modifiables":["i","j"]},"preCondition":{"name":"((max(A, 0, j, i)) & (j != A.length)) & (A[j] <= A[i])","modifiables":["i","j"]},"proven":false,"id":"1631d566-b105-482e-b824-5ac98758dd09","tested":false}],"preProve":true},"postCondition":{"name":"max(A, 0, j+1, i)","modifiables":["i","j"]},"preCondition":{"name":"(max(A, 0, j, i)) & (j != A.length)","modifiables":["i","j"]},"proven":false,"id":"4494a0fb-7b1a-4468-a6dc-c62d04658181","tested":false},"secondStatement":{"name":"statement2","refinement":{"name":"j = j+1;","postCondition":{"name":"max(A, 0, j, i)","modifiables":["i","j"]},"preCondition":{"name":"max(A, 0, j+1, i)","modifiables":["i","j"]},"proven":true,"id":"ccde479c-9742-4796-b71f-c8280ee84b02","tested":false},"postCondition":{"name":"max(A, 0, j, i)","modifiables":["i","j"]},"preCondition":{"name":"max(A, 0, j+1, i)","modifiables":["i","j"]},"proven":false,"id":"ac8b23d9-3ae9-46c4-856a-bce88417b114","tested":false},"intermediateCondition":{"name":"max(A, 0, j+1, i)","modifiables":["i","j"]}},"postCondition":{"name":"max(A, 0, j, i)","modifiables":["i","j"]},"preCondition":{"name":"(max(A, 0, j, i)) & (j != A.length)","modifiables":["i","j"]},"proven":false,"id":"d3331b91-5cc6-4f6f-a9c6-ac46e51b0ee4","tested":false},"variant":{"name":"A.length - j"},"invariant":{"name":"max(A, 0, j, i)"},"guard":{"name":"j != A.length"},"variantProven":true,"preProven":true,"postProven":true},"postCondition":{"name":"max(A, 0, A.length, i)","modifiables":["i","j"]},"preCondition":{"name":"A.length > 0 & i = 0 & j = 1","modifiables":["i","j"]},"proven":false,"id":"8eac16d4-c94a-415e-bd56-4be3b961edf6","tested":false},"intermediateCondition":{"name":"A.length > 0 & i = 0 & j = 1","modifiables":["i","j"]}},"postCondition":{"name":"max(A, 0, A.length, i)","modifiables":["i","j"]},"preCondition":{"name":"A.length > 0"},"proven":false,"id":"126b6e96-ad72-469a-b682-510aebb13939","tested":false},"proven":true,"comment":"","compositionTechnique":"CONTRACT_OVERRIDING","className":"","methodName":"","tested":false,"javaVariables":{"type":"JavaVariables","variables":[{"name":"int j","kind":"LOCAL"},{"name":"int i","kind":"LOCAL"},{"name":"int[] A","kind":"LOCAL"}]},"globalConditions":{"type":"GlobalConditions","conditions":[{"name":"A != null"},{"name":"A.length > 0"},{"name":"A.length < 10"},{"name":"i >= 0 & i < A.length"},{"name":"j >= 0 & j <= A.length"}]},"renaming":{"type":"Renaming","rename":[{"type":"int","function":"maxi","newName":"max"}]}}`) as EMFCbcFormula)), this.helperfile])},
  ];*/
}
