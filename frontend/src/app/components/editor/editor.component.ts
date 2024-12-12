import {AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, Type, ViewChild, ViewContainerRef} from '@angular/core';
import {CommonModule, NgComponentOutlet} from '@angular/common';
import {RefinementWidgetComponent} from "../../widgets/refinement-widget/refinement-widget.component";
import {Refinement} from "../../types/refinement";
import {MatButtonModule} from "@angular/material/button";
import {AddRefinementWidgetComponent} from "../../widgets/add-refinement-widget/add-refinement-widget.component";
import {TreeService} from "../../services/tree/tree.service";
import {MatIconModule} from "@angular/material/icon";
import {MatExpansionModule} from "@angular/material/expansion";
import {VariablesComponent} from "./variables/variables.component";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatMenuModule} from "@angular/material/menu";
import { GlobalConditionsComponent } from './global-conditions/global-conditions.component';
import { SimpleStatementComponent } from './statements/simple-statement/simple-statement.component';
import { ProjectService } from '../../services/project/project.service';
import { CBCFormula } from '../../services/project/CBCFormula';
import { SimpleStatement } from '../../types/statements/simple-statement';
import { OptionsComponent } from './options/options.component';
import { Router } from '@angular/router';
import { EditorService } from '../../services/editor/editor.service';
import { Position } from '../../types/position';

/**
 * Component to edit {@link CBCFormula} by editing a grahical representation based of the statement components like {@link SimpleStatementComponent}.
 * This Component is opened when the user clicks on the .diagram files in the project explorer.
 * The path of the component is /editor/diagram/{file.urn}
 */
@Component({
    selector: 'app-editor',
    imports: [CommonModule, MatButtonModule, MatIconModule, MatExpansionModule, VariablesComponent, MatTooltipModule, MatMenuModule, GlobalConditionsComponent, OptionsComponent],
    templateUrl: './editor.component.html',
    styleUrl: './editor.component.scss'
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild("examplesSpawn", {read: ViewContainerRef, static: false}) private examplesSpawn!: ViewContainerRef
  @ViewChild(NgComponentOutlet, {static: false}) private rootNodeOutlet!: NgComponentOutlet
  @ViewChild("variables") private variables! : VariablesComponent
  @ViewChild("conditions") private conditions! : GlobalConditionsComponent
  @ViewChild("editorContainer") private editorContainer!: ElementRef

  private _rootNode: Type<SimpleStatementComponent> | undefined

  private _urn : string = ''
  private _viewInit : boolean = false

  /**
   * Constructor for dependency injection of the services
   * @param treeService The service to interact with the refinements 
   * @param projectService The service to persist and laod the file content
   */
  public constructor(
    private treeService: TreeService,
    private projectService : ProjectService,
    private editorService : EditorService,
    private router : Router
  ) {
    this.projectService.editorNotify.subscribe(() => {
      this.saveContentToFile()
    })

    this.treeService.exportNotifier.subscribe(() => this.export())
  }
  
  /**
   * Input for the urn of the file to edit
   * @param uniformRessourceName The path variable of the file to edit
   */
  @Input()
  public set urn(uniformRessourceName : string) {

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
    Refinement.resetIDs(1)
    this._rootNode = SimpleStatementComponent

    // if the child is defined delete the child and all grandchildren and 
    if (child) {
      this.treeService.deletionNotifier.next(child)
      this.examplesSpawn.clear()
    }

    if (this._viewInit) {
      this.loadFileContent()
    }
  }

  
  public ngAfterViewInit(): void {
    this._viewInit = true
    // workaround to ensure proper loading of file content on switch between files
    setTimeout(() => this.loadFileContent(), 10)
    this.projectService.editorNotify.subscribe(() => {
      this.saveContentToFile()
    })

    this.treeService.editorWidth = this.editorContainer.nativeElement.offsetWidth
    this.editorService.reload.subscribe(() => {
      let child : Refinement | undefined
      if (this.treeService.rootNode) {
        child = (this.treeService.rootNode as SimpleStatementComponent).statement
      }

      Refinement.resetIDs(1)
      
      if (child) {
        this.treeService.deletionNotifier.next(child)
        this.examplesSpawn.clear()
      }
      this.loadFileContent()
    })
  }

  public ngOnDestroy(): void {
    this.saveContentToFile()
    this._viewInit = false
  }

  /**
   * Save current editor content to {@link CBCFormula}
   */
  private saveContentToFile() : void {
    // create a new Formula to save 
    const formula = new CBCFormula()
    if (this.treeService.rootNode) {

      const rootNode = (this.treeService.rootNode as SimpleStatementComponent).export()
      formula.statement = (rootNode as SimpleStatement).refinement
      formula.preCondition = rootNode.preCondition
      formula.postCondition = rootNode.postCondition
      formula.javaVariables = this.treeService.variables
      formula.globalConditions = this.treeService.conditions
      formula.position = rootNode.position
      formula.proven = rootNode.proven
    }

    if (this._urn !== '' && this.treeService.rootNode) {
      // save the current state outside of the component
      this.projectService.syncFileContent(this._urn, formula)
    }
  }

  private export() {
    const formula = new CBCFormula()
    if (this.treeService.rootNode) {
      const rootNode = (this.treeService.rootNode as SimpleStatementComponent).export()
      formula.statement = (rootNode as SimpleStatement).refinement
      formula.preCondition = rootNode.preCondition
      formula.postCondition = rootNode.postCondition
      formula.javaVariables = this.treeService.variables
      formula.globalConditions = this.treeService.conditions
      formula.position = rootNode.position
      formula.proven = rootNode.proven
    }

    const urnSplit = this._urn.split("/")
    const structure = JSON.stringify(formula, null, 2);
    const blob = new Blob([structure], {type: "application/json"});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = urnSplit[urnSplit.length - 1] + ".json"
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Load {@link CBCFormula} in to editor to be edited
   */
  private async loadFileContent() : Promise<void> {
    // load the diagram of the file into the component

    this.variables.removeAllVariables()
    this.conditions.removeAllConditions()

    Refinement.resetIDs(2)

    let newFormula : CBCFormula | undefined = undefined
    try {
      newFormula = await this.projectService.getFileContent(this._urn) as CBCFormula
    } catch (e) {

      const projectId = this.router.parseUrl(this.router.url).queryParamMap.get("projectId")
      if (!this.projectService.projectId && projectId) {
        this.projectService.projectId = projectId

        this.projectService.dataChange.subscribe(async () => {
          newFormula = await this.projectService.getFileContent(this._urn) as CBCFormula
          this.loadFileContent()
        })

        this.projectService.downloadWorkspace()
      }

    }

    // if the file is not empty load content
    if (newFormula && newFormula.statement) {

      // manually set the attributes of the root node
      const root = this.rootNodeOutlet['_componentRef'].instance as SimpleStatementComponent
      root.statementElementRef = undefined
      root.precondition.content = newFormula.preCondition.content
      root.postcondition.content = newFormula.postCondition.content
      root.position = newFormula.position
      root.proven = newFormula.proven
      // redraw the root element at the correct position
      root.getRedrawNotifier().next()
      
      // import the tree under the root statement recursively
      const newChild = (newFormula.statement as SimpleStatement).toComponent(this.examplesSpawn)

      if (newChild) {
        root.statement = newChild?.[0]
        root.statementElementRef = newChild?.[1].location
      }

      // redraw all links between the components
      setTimeout(() => root.refreshLinkState(), 5)

      this.variables.importVariables(newFormula.javaVariables)
      this.conditions.importConditions(newFormula.globalConditions)

      return
    }
    
    // file is empty, reset rootNode to default values
    this._rootNode = SimpleStatementComponent
    const root =  this.rootNodeOutlet['_componentRef'].instance as SimpleStatementComponent
    root.precondition.content = ""
    root.postcondition.content = ""
    root.position = new Position(this.treeService.editorWidth / 2 - 450, 10)
    root.proven = false
  }

  /**
   * Redraw the lines when scrolling in the editor
   */
  public onEditorContainerScrolled(): void {
    this.treeService.onEditorContainerScrolled();
  }

  @HostListener('window:resize', ['event'])
  onHostWindowResize() {
    this.treeService.editorWidth = this.editorContainer.nativeElement.offsetWidth
  }

  public get rootNode() {
    return this._rootNode
  }
}
