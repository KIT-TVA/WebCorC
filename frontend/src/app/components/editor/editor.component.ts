import {
  AfterViewInit,
  Component,
  computed,
  effect,
  Input,
  OnDestroy,
  signal,
  Signal,
  ViewChild,
  ViewContainerRef,
} from "@angular/core";

import {MatButtonModule} from "@angular/material/button";
import {TreeService} from "../../services/tree/tree.service";
import {MatIconModule} from "@angular/material/icon";
import {MatExpansionModule} from "@angular/material/expansion";
import {VariablesComponent} from "./variables/variables.component";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatMenuModule} from "@angular/material/menu";
import {GlobalConditionsComponent} from "./global-conditions/global-conditions.component";
import {ProjectService} from "../../services/project/project.service";
import {CBCFormula} from "../../types/CBCFormula";
import {Router} from "@angular/router";
import {EditorService} from "../../services/editor/editor.service";
import {RenamingComponent} from "./renaming/renaming.component";
import {StatementDelegatorComponent} from "./statements/statement-delegator/statement-delegator.component";
import {AbstractStatementNode} from "../../types/statements/nodes/abstract-statement-node";
import {
  DynamicNode,
  Edge,
  MiniMapComponent,
  NodeHtmlTemplateDirective,
  NodePositionChange,
  VflowComponent,
} from "ngx-vflow";
import {EditorSidemenuComponent} from "./editor-sidemenu/editor-sidemenu.component";
import {EditorBottommenuComponent} from "./editor-bottommenu/editor-bottommenu.component";
import {GlobalSettingsService} from "../../services/global-settings.service";

/**
 * Component to edit {@link CBCFormula} by editing a grahical representation based of the statement components like {@link SimpleStatementComponent}.
 * This Component is opened when the user clicks on the .diagram files in the project explorer.
 * The path of the component is /editor/diagram/{file.urn}
 * {@link https://material.angular.io/cdk/drag-drop/overview}
 */
@Component({
  selector: "app-editor",
  imports: [
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
    MatMenuModule,
    StatementDelegatorComponent,
    VflowComponent,
    NodeHtmlTemplateDirective,
    MiniMapComponent,
    EditorSidemenuComponent,
    EditorBottommenuComponent,
  ],
  templateUrl: "./editor.component.html",
  standalone: true,
  styleUrl: "./editor.component.scss",
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild("examplesSpawn", { read: ViewContainerRef, static: false })
  private examplesSpawn!: ViewContainerRef;
  @ViewChild("variables") private variables!: VariablesComponent;
  @ViewChild("conditions") private conditions!: GlobalConditionsComponent;
  @ViewChild("renaming") private renaming!: RenamingComponent;

  private _viewInit: boolean = false;

  protected statements: Signal<AbstractStatementNode[]> = signal([]);

  /**
   * Constructor for dependency injection of the services
   * @param treeService The service to interact with the refinements
   * @param projectService The service to persist and laod the file content
   * @param editorService
   * @param router
   * @param globalSettingsService
   */
  public constructor(
    private treeService: TreeService,
    private projectService: ProjectService,
    private editorService: EditorService,
    private router: Router,
    protected globalSettingsService: GlobalSettingsService
  ) {
    this.projectService.editorNotify.subscribe(() => {
      this.saveContentToFile();
    });
    this.setupVFlowSync();
    this.treeService.exportNotifier.subscribe(() => this.export());
    this.statements = treeService.getStatementNodes();
  }

  private _urn: string = "";

  /**
   * Input for the urn of the file to edit.
   * On input the file content of the current opened file gets saved and the file content of the file to be opened read and loaded into the editor.
   * @param uniformRessourceName The path variable of the file to edit
   */
  @Input()
  public set urn(uniformRessourceName: string) {
    // prevent reloading the same context
    if (uniformRessourceName == this._urn) {
      return;
    }

    if (this._viewInit) {
      this.saveContentToFile();
    }
    this._urn = uniformRessourceName;
    this.editorService.currentFileName = uniformRessourceName.substring(
      uniformRessourceName.lastIndexOf("/"),
    );
    if (this._viewInit) {
      this.loadFileContent();
    }
  }

  /**
   * Function to be triggered after the view got initalized.
   */
  public ngAfterViewInit(): void {
    this._viewInit = true;
    // workaround to ensure proper loading of file content on switch between files
    setTimeout(() => {
      this.loadFileContent();
    }, 10);
    this.projectService.editorNotify.subscribe(() => {
      this.saveContentToFile();
    });

    this.editorService.reload.subscribe(() => {
      this.examplesSpawn.clear();
      this.loadFileContent();
    });
  }

  public ngOnDestroy(): void {
    this.saveContentToFile();
    this._viewInit = false;
  }

  /**
   * Save current editor content to {@link CBCFormula}
   */
  private saveContentToFile(): void {
    // create a new Formula to save
    let formula = new CBCFormula();
    if (this.treeService.rootFormula) {
      formula = this.treeService.rootFormula;
    }
    if (this._urn !== "" && this.treeService.rootFormula?.statement) {
      // save the current state outside of the component
      this.projectService.syncFileContent(this._urn, formula);
    }
  }

  private export() {
    const formula = this.treeService.rootFormula;
    const urnSplit = this._urn.split("/");
    const structure = JSON.stringify(formula, null, 2);
    const blob = new Blob([structure], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = urnSplit[urnSplit.length - 1] + ".json";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Load {@link CBCFormula} in to editor to be edited
   */
  private async loadFileContent(): Promise<void> {
    // load the diagram of the file into the component
    console.log("variable: " + this.variables);
    this.variables.removeAllVariables();
    this.conditions.removeAllConditions();
    this.renaming.removeAllRenaming();

    let newFormula: CBCFormula | undefined = undefined;
    try {
      newFormula = (await this.projectService.getFileContent(
        this._urn,
      )) as CBCFormula;
    } catch {
      const projectId = this.router
        .parseUrl(this.router.url)
        .queryParamMap.get("projectId");
      if (!this.projectService.projectId && projectId) {
        this.projectService.projectId = projectId;
        this.projectService.dataChange.subscribe(async () => {
          newFormula = (await this.projectService.getFileContent(
            this._urn,
          )) as CBCFormula;
          await this.loadFileContent();
        });

        this.projectService.downloadWorkspace();
      }
    }

    // if the file is not empty load content
    if (newFormula) {
      this.treeService.setFormula(newFormula);
      this.statements = this.treeService.getStatementNodes();

      //TODO: This should be done with Inputs instead.
      this.variables.importVariables(newFormula.javaVariables);
      this.conditions.importConditions(newFormula.globalConditions);
      this.renaming.importRenaming(newFormula.renamings);

      return;
    }

    // file is empty, reset rootNode to default values
    //TODO: reimplement
  }

  /**
   * VFlow doesn't support using computed signals as inputs for the graph, so we manually set the values here.
   *
   */
  protected nodes: DynamicNode[] = [];
  protected edges: Edge[] = [];
  protected nodez: Signal<DynamicNode[]> = computed(() =>
    this.statements().map((statement) => {
      return {
        id: statement.statement.id,
        type: "html-template",
        point: signal({
          x: statement.position().xinPx,
          y: statement.position().yinPx,
        }),
        data: signal(statement),
      };
    }),
  );

  private setupVFlowSync() {
    effect(() => {
      this.nodes = this.nodez();
      this.edges = this.computeEdges(this.statements());
    });
  }

  private computeEdges(statements: AbstractStatementNode[]): Edge[] {
    const edges: Edge[] = [];
    statements.forEach((parent) => {
      parent.children.forEach((child, index) => {
        if (child) {
          edges.push({
            id: parent.statement.id + " -> " + child.statement.id,
            type: "default",
            source: parent.statement.id,
            target: child.statement.id,
            sourceHandle: String(index),
            curve: "smooth-step",
            markers: {
              end: {
                type: "arrow",
              },
            },
          });
        }
      });
    });
    return edges;
  }

  /**
   * When the nodes are moved around in the editor by VFlow, save the new positions to the model.
   */
  handlePositionChange($event: NodePositionChange[]) {
    $event.forEach((change) => {
      this.statements()
        .find((node) => node.statement.id == change.id)
        ?.setPosition(change.point);
    });
  }
}
