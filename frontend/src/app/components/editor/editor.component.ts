import {AfterViewChecked, AfterViewInit, Component, Input, OnDestroy, Type, ViewChild, ViewContainerRef} from '@angular/core';
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
import { SimpleStatement } from '../../types/statements/simple-statement';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, RefinementWidgetComponent, MatButtonModule, AddRefinementWidgetComponent, MatIconModule, MatExpansionModule, FormalParametersComponent, VariablesComponent, MatTooltipModule, MatMenuModule, GlobalConditionsComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild("examplesSpawn", {read: ViewContainerRef, static: false}) examplesSpawn!: ViewContainerRef;
  @ViewChild(NgComponentOutlet, {static: false}) rootNodeOutlet!: NgComponentOutlet;

  rootNode: Type<SimpleStatementComponent> | undefined

  private _urn : string = ''
  private _viewInit : boolean = false

  constructor(public treeService: TreeService, private projectService : ProjectService) {
  }
  
  


  @Input()
  set urn(uniformRessourceName : string) {

    console.log("Recieved urn: ", uniformRessourceName)

    // prevent reloading the same context
    if (uniformRessourceName == this._urn) {
      return
    }

    
    if (this._viewInit) {
      this.saveContentToFile()
    }
    
    
    this._urn = uniformRessourceName

    let child : Refinement | undefined
    // get the child of the root element
    if (this.treeService.rootNode) {
      child = (this.treeService.rootNode as SimpleStatementComponent).statement
    }

    Refinement.resetIDs()

    this.rootNode = SimpleStatementComponent

    // if the child is defined delete the child and all grandchildren and 
    if (child) {
      this.treeService.deletionNotifier.next(child)
      this.examplesSpawn.clear()
      Refinement.resetIDs(2)
    }


    

    console.log('view init :', this._viewInit)

    if (this._viewInit) {
      this.loadFileContent()
    }
  }

  
  public ngAfterViewInit(): void {

    console.log("graph editor created")
    this._viewInit = true
    setTimeout(() => this.loadFileContent(), 10)
    console.log('view init :', this._viewInit)
  }

  public ngOnDestroy(): void {

    console.log("graph editor destroyed")
   
    this.saveContentToFile()
    this._viewInit = false
    console.log('view init :', this._viewInit)
  }

  private saveContentToFile() : void {
    // create a new Formula to save 
    let formula = new CBCFormula()
    if (this.treeService.rootNode) {
      formula.statement = this.treeService.rootNode.export()
      formula.javaVariables = this.treeService.variables
    }

    if (this._urn !== '' && this.treeService.rootNode) {
      // save the current state outside of the component
      this.projectService.syncFileContent(this._urn, formula)
    }
  }

  private loadFileContent() : void {
    // load the diagramm of the file into the component

    let newFormula = this.projectService.getFileContent(this._urn) as CBCFormula
    if (newFormula.statement) {
      
      const root =  this.rootNodeOutlet['_componentRef'].instance as SimpleStatementComponent
      root.statementElementRef = undefined

      root.precondition = newFormula.statement.preCondition
      root.postcondition = newFormula.statement.postCondition

      

      const newChild = (newFormula.statement as SimpleStatement).statement?.toComponent(this.examplesSpawn)

      if (newChild) {
        root.statement = newChild?.[0]
        root.statementElementRef = newChild?.[1].location
      }

      setTimeout(() => root.onDragMoveEmitter.next(), 5)

      // traverse cbc formula statement tree and create components similar to loadingExample from qbc-Frontend

    } else {
      this.rootNode = SimpleStatementComponent
    }
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
