import {AfterViewInit, Component, Input, Type, ViewChild, ViewContainerRef} from '@angular/core';
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
import { GlobalConditionsComponent } from './global-conditions/global-conditions.component';
import { SimpleStatementComponent } from './refinements/simple-statement/simple-statement.component';
import { ProjectService } from '../../services/project/project.service';
import { CBCFormula } from '../../services/project/CBCFormula';
import { Statement } from '../../types/statements/statement';
import { SimpleStatement } from '../../types/statements/simple-statement';
import { Condition } from '../../types/condition/condition';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, RefinementWidgetComponent, MatButtonModule, AddRefinementWidgetComponent, MatIconModule, MatExpansionModule, FormalParametersComponent, VariablesComponent, MatTooltipModule, MatMenuModule, GlobalConditionsComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent implements AfterViewInit {
  @ViewChild("examplesSpawn", {read: ViewContainerRef, static: false}) examplesSpawn!: ViewContainerRef;
  @ViewChild(NgComponentOutlet, {static: false}) rootNodeOutlet!: NgComponentOutlet;

  rootNode: Type<SimpleStatementComponent> | undefined

  private _urn : string = ''

  constructor(public treeService: TreeService, private projectService : ProjectService) {
  }


  @Input()
  set urn(uniformRessourceName : string) {
    // prevent reloading the same context
    if (uniformRessourceName == this._urn) {
      return
    }

    let formula = new CBCFormula()
    if (this.treeService.rootNode) {
      formula.statement = this.treeService.rootNode.export()
      formula.javaVariables = this.treeService.variables
    }

    if (this._urn !== '' && this.treeService.rootNode) {
      // save the current state outside of the component
      this.projectService.syncFileContent(this._urn, formula)
    }


    let child : Refinement | undefined

    if (this.treeService.rootNode) {
      child = (this.treeService.rootNode as SimpleStatementComponent).statement
    }

    if (this.treeService.rootNode && child) {
      console.log("delete")

      this.rootNode = SimpleStatementComponent

      this.treeService.rootNode = undefined

      const rootRef = this.rootNodeOutlet['_componentRef'].instance as SimpleStatementComponent

      if (rootRef.statement) {
        this.treeService.deletionNotifier.next(rootRef.statement)
      }
      

      this.examplesSpawn.clear()

      Refinement.resetIDs(2)
    }

    // load the diagramm of the file into the component
    let newFormula = this.projectService.getFileContent(uniformRessourceName) as CBCFormula
    console.log(newFormula)
    if (newFormula.statement) {
      
      const root =  this.rootNodeOutlet['_componentRef'].instance as SimpleStatementComponent

      root.precondition = newFormula.statement.preCondition
      root.postcondition = newFormula.statement.postCondition

      const child = (newFormula.statement as SimpleStatement).statement?.toComponent(this.examplesSpawn)

      console.log("child")
      console.log(child)


      if (child) {
        root.statement = child?.[0]
        root.statementElementRef = child?.[1].location
      }

      
      
      // traverse cbc formula statement tree and create components similar to loadingExample from qbc-Frontend

    } else {
      console.log("create new formula")
      this.rootNode = SimpleStatementComponent
    }

    this._urn = uniformRessourceName
  }

  
  ngAfterViewInit(): void {
    
  }

  addRootRefinement(type: Type<SimpleStatementComponent>): void {
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
}
