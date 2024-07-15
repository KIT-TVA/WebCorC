import {AfterViewInit, Component, Type, ViewChild, ViewContainerRef} from '@angular/core';
import {CommonModule, NgComponentOutlet} from '@angular/common';
import {RefinementWidgetComponent} from "../../widgets/refinement-widget/refinement-widget.component";
import {Refinement} from "../../types/refinement";
import {MatButtonModule} from "@angular/material/button";
import {AddRefinementWidgetComponent} from "../../widgets/add-refinement-widget/add-refinement-widget.component";
import {TreeService} from "../../services/tree/tree.service";
import {MatIconModule} from "@angular/material/icon";
import {MatExpansionModule} from "@angular/material/expansion";
import {FormalParametersComponent} from "./formal-parameters/formal-parameters.component";
import {QbCConstant} from "../../translation/constants";
import {VariablesComponent} from "./variables/variables.component";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatMenuModule} from "@angular/material/menu";
import {SeqRefinementComponent} from "./refinements/seq-refinement/seq-refinement.component";
import {FormalParameter} from "../../types/formal-parameter";
import {FormalNumberSet} from "../../types/form-spec-values/formalNumberSet";
import {InitRefinementComponent} from "./refinements/init-refinement/init-refinement.component";
import {UnitRefinementComponent} from "./refinements/unit-refinement/unit-refinement.component";
import {WhileRefinementComponent} from "./refinements/while-refinement/while-refinement.component";
import {SwRefinementComponent} from "./refinements/sw-refinement/sw-refinement.component";
import {MacrosComponent} from "./macros/macros.component";
import {Macro} from "../../types/macro";
import {CaseRefinementComponent} from "./refinements/case-refinement/case-refinement.component";
import {Condition} from "../../types/condition/condition";
import { GlobalConditionsComponent } from './global-conditions/global-conditions.component';
import { SimpleStatementComponent } from './refinements/simple-statement/simple-statement.component';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, RefinementWidgetComponent, MatButtonModule, AddRefinementWidgetComponent, MatIconModule, MatExpansionModule, FormalParametersComponent, VariablesComponent, MatTooltipModule, MatMenuModule, MacrosComponent, GlobalConditionsComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent implements AfterViewInit {
  @ViewChild("examplesSpawn", {read: ViewContainerRef, static: false}) examplesSpawn!: ViewContainerRef;
  @ViewChild(NgComponentOutlet, {static: false}) rootNodeOutlet!: NgComponentOutlet;

  rootNode: Type<Refinement> | undefined;

  constructor(public treeService: TreeService) {
  }

  
  ngAfterViewInit(): void {
    this.rootNode = SimpleStatementComponent
  }

  addRootRefinement(type: Type<Refinement>): void {
    this.rootNode = type;
  }

  onEditorContainerScrolled(): void {
    this.treeService.onEditorContainerScrolled();
  }

  preDefinedSymbols(): {symbol: string, description: string}[] {
    const predefined = [
      {symbol: "†", description: "Adjoint (conjugate transpose)"},
      {symbol: "⊗", description: "Tensor product"},
      {symbol: "√", description: "Square root"},
    ];
    predefined.push(...this.treeService.tokenFactories.filter(tf => tf instanceof QbCConstant).map(tf => {
      if (tf instanceof QbCConstant) {
        return {symbol: tf.name, description: tf.description};
      }
      return {symbol: "", description: ""};
    }));
    return predefined;
  }

  loadExample(example: "cointoss" | "tosstillzero" | "teleportation" | "ECNOTalgorithm"): void {
    this.rootNode = SeqRefinementComponent;
    setTimeout(() => {
      const seqRoot = this.rootNodeOutlet['_componentRef'].instance as SeqRefinementComponent;
      if (example === "cointoss") {
        this.loadCoinToss(seqRoot);
      } else if (example === "tosstillzero") {
        this.loadTossTillZero(seqRoot);
      } else if (example === "teleportation") {
        this.loadTeleportation(seqRoot);
      } else if (example === "ECNOTalgorithm") {
        this.loadECNOTAlgorithm(seqRoot);
      }
    }, 50);
  }

  loadCoinToss(seqRoot: SeqRefinementComponent): void {
    seqRoot.precondition.content = "I/2";
    seqRoot.postcondition.content = "|x><x|";
    seqRoot.setIntermediateConditionContent("H|x><x|H");

    const initComponentRef = this.examplesSpawn.createComponent(InitRefinementComponent);
    const initComponent = initComponentRef.instance as InitRefinementComponent;
    initComponent.setInitializedRegisterAndFormGroupValue("q");

    const unitComponentRef = this.examplesSpawn.createComponent(UnitRefinementComponent);
    const unitComponent = unitComponentRef.instance as UnitRefinementComponent;
    unitComponent.setDeclaredRegisterAndFormGroupValue("q");
    unitComponent.unitOperation.content = "H";

    seqRoot.leftHandElementRef = initComponentRef.location;
    seqRoot.leftHandRefinement = initComponent;
    seqRoot.rightHandElementRef = unitComponentRef.location;
    seqRoot.rightHandRefinement = unitComponent;

    this.treeService.addFormalParameter(new FormalParameter("x", new FormalNumberSet("0,1")))
  }

  loadTossTillZero(seqRoot: SeqRefinementComponent): void {
    seqRoot.precondition.content = "I";
    seqRoot.postcondition.content = "|0><0|";
    seqRoot.setIntermediateConditionContent("|+><+|");

    // Create sub program S_Init
    const sInitSeqRef = this.examplesSpawn.createComponent(SeqRefinementComponent);
    const sInitSeq = sInitSeqRef.instance as SeqRefinementComponent;
    seqRoot.leftHandElementRef = sInitSeqRef.location;
    seqRoot.leftHandRefinement = sInitSeq;
    sInitSeq.setIntermediateConditionContent("|0><0|");

    const sInitInitRef = this.examplesSpawn.createComponent(InitRefinementComponent);
    const sInitInit = sInitInitRef.instance as InitRefinementComponent;
    sInitInit.setInitializedRegisterAndFormGroupValue("q");

    const sInitUnitRef = this.examplesSpawn.createComponent(UnitRefinementComponent);
    const sInitUnit = sInitUnitRef.instance as UnitRefinementComponent;
    sInitUnit.setDeclaredRegisterAndFormGroupValue("q");
    sInitUnit.unitOperation.content = "H";

    sInitSeq.leftHandElementRef = sInitInitRef.location;
    sInitSeq.leftHandRefinement = sInitInit;
    sInitSeq.rightHandElementRef = sInitUnitRef.location;
    sInitSeq.rightHandRefinement = sInitUnit;

    // Create sub program S_Body
    const sBodyWhileRef = this.examplesSpawn.createComponent(WhileRefinementComponent);
    const sBodyWhile = sBodyWhileRef.instance as WhileRefinementComponent;
    seqRoot.rightHandElementRef = sBodyWhileRef.location;
    seqRoot.rightHandRefinement = sBodyWhile;
    sBodyWhile.setMeasuredRegisterAndFormGroupValue("q");
    sBodyWhile.loopInvariant.content = "|1><1|";

    const sBodySwRef = this.examplesSpawn.createComponent(SwRefinementComponent);
    const sBodySw = sBodySwRef.instance as SwRefinementComponent;
    sBodyWhile.bodyRefinementRef = sBodySwRef.location;
    sBodyWhile.bodyRefinement = sBodySw;
    sBodySw.weakenedPrecondition.content = "|1><1|";
    sBodySw.strengthenedPostcondition.content = "|-><-|";

    const sBodyUnitRef = this.examplesSpawn.createComponent(UnitRefinementComponent);
    const sBodyUnit = sBodyUnitRef.instance as UnitRefinementComponent;
    sBodySw.bodyRefinementRef = sBodyUnitRef.location;
    sBodySw.bodyRefinement = sBodyUnit;
    sBodyUnit.setDeclaredRegisterAndFormGroupValue("q");
    sBodyUnit.unitOperation.content = "H";
  }

  loadTeleportation(seqRoot: SeqRefinementComponent): void {
    // Uses the variables order a,b,r,q.

    this.treeService.addMacro(new Macro("|p>", "(1/√(2))(|00>+|11>)"));
    this.treeService.addMacro(new Macro("<p|", "(1/√(2))(<00|+<11|)"));

    const q00 = "(|00><00|)_{q,a}(|p><p|)_{b,r}";
    const q01 = "(|01><01|)_{q,a}(Z_{b}(|p><p|)_{b,r}Z_{b})";
    const q10 = "(|10><10|)_{q,a}(X_{b}(|p><p|)_{b,r}X_{b})";
    const q11 = "(|11><11|)_{q,a}(†(XZ)_{b}(|p><p|)_{b,r}(XZ)_{b})";
    const qs = [q00, q01, q10, q11];
    seqRoot.precondition.content = "|p><p|⊗|p><p|";
    seqRoot.postcondition.content = "(|p><p|)_{b,r}";
    seqRoot.setIntermediateConditionContent(qs.join("+"));

    const sAliceUnitRef = this.examplesSpawn.createComponent(UnitRefinementComponent);
    const sAliceUnit = sAliceUnitRef.instance as UnitRefinementComponent;
    seqRoot.leftHandElementRef = sAliceUnitRef.location;
    seqRoot.leftHandRefinement = sAliceUnit;
    sAliceUnit.setDeclaredRegisterAndFormGroupValue("q,a");
    sAliceUnit.unitOperation.content = "(H⊗I)CNOT";

    const rightCaseRef = this.examplesSpawn.createComponent(CaseRefinementComponent);
    const rightCase = rightCaseRef.instance as CaseRefinementComponent;
    seqRoot.rightHandElementRef = rightCaseRef.location;
    seqRoot.rightHandRefinement = rightCase;
    rightCase.setMeasuredRegisterAndFormGroupValue("q,a");

    const outcomes = ["00", "01", "10", "11"];
    const units = ["I", "Z", "X", "XZ"];
    for (let i=0; i<4; i++) {
      const sBobUnitXYRef = this.examplesSpawn.createComponent(UnitRefinementComponent);
      const sBobUnitXY = sBobUnitXYRef.instance as UnitRefinementComponent;
      rightCase.cases[i].precondition = new Condition(rightCase.id, "P"+outcomes[i]);
      rightCase.cases[i].precondition.content = qs[i];
      sBobUnitXY.precondition = rightCase.cases[i].precondition;
      sBobUnitXY.postcondition = rightCase.postcondition;
      rightCase.cases[i].bodyRefinementRef = sBobUnitXYRef.location;
      rightCase.cases[i].bodyRefinement = sBobUnitXY;
      sBobUnitXY.setDeclaredRegisterAndFormGroupValue("b");
      sBobUnitXY.unitOperation.content = units[i];
    }

    this.treeService.addVariable("r");
    this.treeService.moveVariableByNameTo("a", 0);
    this.treeService.moveVariableByNameTo("b", 1);
    this.treeService.moveVariableByNameTo("r", 2);
    this.treeService.moveVariableByNameTo("q", 3);
  }

  loadECNOTAlgorithm(seqRoot: SeqRefinementComponent): void {
    seqRoot.precondition.content = "I⊗I⊗I";
    seqRoot.postcondition.content = "|1><1|⊗|0><0|⊗|1><1|";
    seqRoot.setIntermediateConditionContent("|0><0|⊗|0><0|⊗|0><0|");

    const sInitSeqRef = this.examplesSpawn.createComponent(SeqRefinementComponent);
    const sInitSeq = sInitSeqRef.instance as SeqRefinementComponent;
    seqRoot.leftHandElementRef = sInitSeqRef.location;
    seqRoot.leftHandRefinement = sInitSeq;
    sInitSeq.setIntermediateConditionContent("|0><0|⊗I⊗|0><0|");

    const sInitI1Ref = this.examplesSpawn.createComponent(InitRefinementComponent);
    const sInitI1 = sInitI1Ref.instance as InitRefinementComponent;
    sInitI1.setInitializedRegisterAndFormGroupValue("a,c");

    const sInitI2Ref = this.examplesSpawn.createComponent(InitRefinementComponent);
    const sInitI2 = sInitI2Ref.instance as InitRefinementComponent;
    sInitI2.setInitializedRegisterAndFormGroupValue("b");

    sInitSeq.leftHandElementRef = sInitI1Ref.location;
    sInitSeq.leftHandRefinement = sInitI1;
    sInitSeq.rightHandElementRef = sInitI2Ref.location;
    sInitSeq.rightHandRefinement = sInitI2;

    const unitRef = this.examplesSpawn.createComponent(UnitRefinementComponent);
    const unit = unitRef.instance as UnitRefinementComponent;
    unit.setDeclaredRegisterAndFormGroupValue("c,a");
    unit.unitOperation.content = "CNOT(X⊗I)"
    seqRoot.rightHandElementRef = unitRef.location;
    seqRoot.rightHandRefinement = unit;

    this.treeService.moveVariableByNameTo("a", 0);
    this.treeService.moveVariableByNameTo("b", 1);
    this.treeService.moveVariableByNameTo("c", 2);
  }
}
