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

  rootNode: Type<Refinement> | undefined;

  private _urn : string = ''

  constructor(public treeService: TreeService, private projectService : ProjectService) {

    this.treeService.deletionNotifier.subscribe((refinement) => {
      if (treeService.isRootNode(refinement)) {
        this.rootNode = undefined
        this.treeService.rootNode = undefined
        Refinement.resetIDs()
      }
    })
  }


  @Input()
  set urn(uniformRessourceName : string) {
    // prevent reloading the same context
    if (uniformRessourceName == this._urn) {
      return
    }

    console.log("create new formula")
    let formula = new CBCFormula()

    if (this.treeService.rootNode) {
      formula.statement = this.treeService.rootNode
      formula.javaVariables = this.treeService.variables
    }
    
    if (this._urn !== '' && this.treeService.rootNode) {
      // save the current state outside of the component
      this.projectService.syncFileContent(this._urn, formula)
      this.treeService.deletionNotifier.next(this.treeService.rootNode)
    }
    
   

    // load the diagramm of the file into the component
    let newFormula = this.projectService.getFileContent(uniformRessourceName) as CBCFormula
    this.rootNode = SimpleStatementComponent
    if (newFormula.statement) {

      console.log("trying to load the newFormula")
      console.log(newFormula.statement)

      this.treeService.rootNode = newFormula.statement

      // traverse cbc formula statement tree and create components similar to loadingExample from qbc-Frontend

    } else {}

    this._urn = uniformRessourceName

  }

  
  ngAfterViewInit(): void {
    
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
}
