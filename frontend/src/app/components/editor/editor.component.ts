import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  Type,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {CommonModule, NgComponentOutlet} from '@angular/common';
import {Refinement} from "../../types/refinement";
import {MatButtonModule} from "@angular/material/button";
import {TreeService} from "../../services/tree/tree.service";
import {MatIconModule} from "@angular/material/icon";
import {MatExpansionModule} from "@angular/material/expansion";
import {VariablesComponent} from "./variables/variables.component";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatMenuModule} from "@angular/material/menu";
import {GlobalConditionsComponent} from './global-conditions/global-conditions.component';
import {ProjectService} from '../../services/project/project.service';
import {CBCFormula} from '../../types/CBCFormula';
import {Router} from '@angular/router';
import {OptionsComponent} from './options/options.component';
import {EditorService} from '../../services/editor/editor.service';
import {RenamingComponent} from './renaming/renaming.component';
import {SimpleStatementComponent} from './statements/simple-statement/simple-statement.component';
import {MatTab, MatTabGroup, MatTabLabel} from "@angular/material/tabs";
import {AiChatComponent} from "../ai-chat/ai-chat.component";
import {ConsoleComponent} from "../console/console.component";
import {MatDrawer, MatDrawerContainer} from "@angular/material/sidenav";
import {StatementDelegatorComponent} from "./statements/statement-delegator/statement-delegator.component";
import {AbstractStatementNode} from "../../types/statements/nodes/abstract-statement-node";

/**
 * Component to edit {@link CBCFormula} by editing a grahical representation based of the statement components like {@link SimpleStatementComponent}.
 * This Component is opened when the user clicks on the .diagram files in the project explorer.
 * The path of the component is /editor/diagram/{file.urn}
 * {@link https://material.angular.io/cdk/drag-drop/overview}
 */
@Component({
    selector: 'app-editor',
    imports: [CommonModule, MatButtonModule, MatIconModule, MatExpansionModule, VariablesComponent, MatTooltipModule, MatMenuModule, GlobalConditionsComponent, OptionsComponent, RenamingComponent, MatTab, MatTabGroup, MatTabLabel, AiChatComponent, ConsoleComponent, MatDrawerContainer, MatDrawer, StatementDelegatorComponent],
    templateUrl: './editor.component.html',
    styleUrl: './editor.component.scss'
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild("examplesSpawn", {read: ViewContainerRef, static: false}) private examplesSpawn!: ViewContainerRef
  @ViewChild(NgComponentOutlet, {static: false}) private rootNodeOutlet!: NgComponentOutlet
  @ViewChild("variables") private variables! : VariablesComponent
  @ViewChild("conditions") private conditions! : GlobalConditionsComponent
  @ViewChild("renaming") private renaming! : RenamingComponent
  @ViewChild("editorContainer", {static : false}) private editorContainer!: ElementRef

  private _rootNode: Type<SimpleStatementComponent> | undefined

  private _urn : string = ''
  private _viewInit : boolean = false

  protected statements: AbstractStatementNode[] = []

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
    this.statements = treeService.getStatementNodes()
  }
  
  /**
   * Input for the urn of the file to edit.
   * On input the file content of the current opened file gets saved and the file content of the file to be opened read and loaded into the editor.
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
    this.editorService.currentFileName = uniformRessourceName.substring(uniformRessourceName.lastIndexOf('/'))
    let child : Refinement | undefined
    
    // get the child of the root element
    if (this.treeService.rootNode) {
      child = (this.treeService.rootNode as SimpleStatementComponent).statement
    }
    this._rootNode = SimpleStatementComponent

    // if the child is defined delete the child and all grandchildren and 
    if (child) {
      this.treeService.deletionNotifier.next(child)
      if (this.examplesSpawn) {
        this.examplesSpawn.clear()
      }
    }

    if (this._viewInit) {
      this.loadFileContent()
    }
  }

  /**
   * Function to be triggered after the view got initalized.
   */
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

      if (child) {
        this.treeService.deletionNotifier.next(child)
      }
      this.examplesSpawn.clear()
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
    let formula = new CBCFormula()
    if (this.treeService.rootFormula) {
      /*TODO Implement some logic to save state of graphical editor to local model, perhaps somewhere else*/
      formula = this.treeService.rootFormula;
    }

    if (this._urn !== '' && this.treeService.rootNode) {
      // save the current state outside of the component
      this.projectService.syncFileContent(this._urn, formula)
    }
  }

  private export() {
    const formula = this.treeService.rootFormula
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
    this.renaming.removeAllRenaming()

    let newFormula : CBCFormula | undefined = undefined
    try {
      newFormula = await this.projectService.getFileContent(this._urn) as CBCFormula
    } catch {

      const projectId = this.router.parseUrl(this.router.url).queryParamMap.get("projectId")
      if (!this.projectService.projectId && projectId) {
        this.projectService.projectId = projectId

        this.projectService.dataChange.subscribe(async () => {
          newFormula = await this.projectService.getFileContent(this._urn) as CBCFormula
          await this.loadFileContent()
        })

        this.projectService.downloadWorkspace()
      }

    }

    // if the file is not empty load content
    if (newFormula && newFormula.statement) {
      // redraw all links between the components
      // TODO: Reimplement

      this.statements = this.treeService.getStatementNodes()

      this.variables.importVariables(newFormula.javaVariables)
      this.conditions.importConditions(newFormula.globalConditions)
      this.renaming.importRenaming(newFormula.renamings)

      return
    }
    
    // file is empty, reset rootNode to default values
    //TODO: reimplement
  }

  /**
   * Redraw the lines when scrolling in the editor
   */
  public onEditorContainerScrolled(): void {
    this.treeService.onEditorContainerScrolled();
  }
  /**
   * Event listener for resizing the browser window.
   * The editorwidth is so used in the Reset Poisiton action to prevent overlapping of the statements.
   */
  @HostListener('window:resize', ['event'])
  public onHostWindowResize() {
    this.treeService.editorWidth = this.editorContainer.nativeElement.offsetWidth
  }

  public get rootNode() {
    return  this._rootNode ? this._rootNode : null
  }
}
