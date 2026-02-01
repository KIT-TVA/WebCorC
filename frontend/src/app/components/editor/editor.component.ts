import {
  AfterViewInit,
  Component,
  effect,
  InjectionToken,
  Input,
  OnDestroy,
  signal,
  Signal,
  ViewChild,
} from "@angular/core";
import { ResetVariant } from "../../types/ResetVariant";
import { MatButtonModule } from "@angular/material/button";
import { TreeService } from "../../services/tree/tree.service";
import { MatIconModule } from "@angular/material/icon";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatMenuModule } from "@angular/material/menu";
import { ProjectService } from "../../services/project/project.service";
import { LocalCBCFormula } from "../../types/CBCFormula";
import { Router } from "@angular/router";
import { EditorService } from "../../services/editor/editor.service";
import { StatementDelegatorComponent } from "./statements/statement-delegator/statement-delegator.component";
import { AbstractStatementNode } from "../../types/statements/nodes/abstract-statement-node";
import {
  Connection,
  ConnectionControllerDirective,
  DynamicNode,
  Edge,
  EdgeLabel,
  EdgeLabelHtmlTemplateDirective,
  EdgeSelectChange,
  HtmlTemplateDynamicNode,
  MiniMapComponent,
  NodeHtmlTemplateDirective,
  NodePositionChange,
  VflowComponent,
} from "ngx-vflow";
import { EditorSidemenuComponent } from "./editor-sidemenu/editor-sidemenu.component";
import { EditorBottommenuComponent } from "./editor-bottommenu/editor-bottommenu.component";
import { GlobalSettingsService } from "../../services/global-settings.service";
import { fromEvent, Subscription } from "rxjs";
import { Button } from "primeng/button";
import { Popover } from "primeng/popover";
import { ConditionSelectorComponent } from "./condition/condition-selector/condition-selector.component";
import { ICondition } from "../../types/condition/condition";
import { disconnectNodes } from "../../types/statements/nodes/statement-node-utils";

export const RED_COLOURED_CONDITIONS = new InjectionToken<ICondition[]>(
  "RedColouredConditions",
);
export const GREEN_COLOURED_CONDITIONS = new InjectionToken<ICondition>(
  "GreenColouredConditions",
);

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
    ConnectionControllerDirective,
    EdgeLabelHtmlTemplateDirective,
    Button,
    Popover,
    ConditionSelectorComponent,
  ],
  providers: [
    { provide: GREEN_COLOURED_CONDITIONS, useValue: [] },
    { provide: RED_COLOURED_CONDITIONS, useValue: [] },
  ],
  templateUrl: "./editor.component.html",
  standalone: true,
  styleUrl: "./editor.component.scss",
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  public showResetButton: boolean = true;
  protected statements: Signal<AbstractStatementNode[]> =
    this.treeService.generateStatementNodes();
  @ViewChild("sidemenu") private sidemenu!: EditorSidemenuComponent;
  private _viewInit: boolean = false;
  private subscriptions: Subscription = new Subscription();

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
    protected globalSettingsService: GlobalSettingsService,
  ) {
    this.setupVFlowSync();
    this.subscriptions.add(this.treeService.exportNotifier.subscribe(() => this.export()));
  }

  private _urn: string = "";

  /**
   * Input for the urn of the file to edit.
   * On input the file content of the current opened file gets saved and the file content of the file to be opened read and loaded into the editor.
   * @param uniformRessourceName The path variable of the file to edit
   */
  @Input()
  public set urn(uniformRessourceName: string) {
    console.log("urn set");
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
    console.log("Editor view initialized");
    this._viewInit = true;
    this.loadFileContent();
    this.subscriptions.add(this.projectService.editorNotify.subscribe(() => {
      this.saveContentToFile();
    }));
    this.subscriptions.add(this.editorService.reload.subscribe(() => {
      this.loadFileContent();
    }));
    this.subscriptions.add(fromEvent(document, "keydown").subscribe((e) => {
      if ((e as KeyboardEvent).key === "Delete") {
        this.deleteEdge();
      }
    }));
  }

  public ngOnDestroy(): void {
    this.saveContentToFile();
    this._viewInit = false;
    this.subscriptions.unsubscribe();
  }

  /**
   * Load {@link CBCFormula} in to editor to be edited
   */
  private async loadFileContent() {
    // load the diagram of the file into the component
    this.sidemenu.variables.removeAllVariables();
    this.sidemenu.conditions.removeAllConditions();
    this.sidemenu.renaming.removeAllRenaming();

    let newFormula: LocalCBCFormula | undefined = undefined;
    newFormula = (await this.projectService.getFileContent(
      this._urn,
    )) as LocalCBCFormula;
    if (!newFormula) {
      newFormula = new LocalCBCFormula();
    }
    this.treeService.setFormula(newFormula, this._urn);
    this.sidemenu.variables.importDiagramVariables();
    this.sidemenu.conditions.importConditions(newFormula.globalConditions);
    this.sidemenu.renaming.importRenaming(newFormula.renamings);
  }

  private setupVFlowSync() {
    effect(() => {
      this.nodes = this.updateNodes(this.statements());
      this.updateEdges(this.statements());
    });
  }

  /**
   * Save current editor content to {@link CBCFormula}
   */
  private saveContentToFile(): void {
    // create a new Formula to save
    let formula = new LocalCBCFormula();
    if (this.treeService.rootFormula) {
      formula = this.treeService.rootFormula;
    }
    this.treeService.finalizeStatements();
    if (this._urn !== "" && this.treeService.rootFormula?.statement) {
      // save the current state outside the component
      this.projectService.syncLocalFileContent(this._urn, formula);
    }
  }

  protected selectedEdges: EdgeSelectChange[] = [];

  /**
   * VFlow doesn't support using computed signals as inputs for the graph, so we manually set the values here.
   *
   */
  protected nodes: DynamicNode<AbstractStatementNode>[] = [];
  protected edges: Edge[] = [];

  private nodeCache = new Map<
    string,
    HtmlTemplateDynamicNode<AbstractStatementNode>
  >();
  private lastStructureHash: string = "";
  private lastNodeIds: string = "";
  private lastNodesArray: DynamicNode<AbstractStatementNode>[] = [];

  private updateNodes(
    statements: AbstractStatementNode[],
  ): DynamicNode<AbstractStatementNode>[] {
    const currentIdsString = statements.map((s) => s.statement.id).join(",");
    let nodesArray = this.lastNodesArray;

    if (currentIdsString !== this.lastNodeIds) {
      const newNodes: DynamicNode<AbstractStatementNode>[] = [];
      const currentIds = new Set<string>();

      for (const statement of statements) {
        const id = statement.statement.id;
        currentIds.add(id);

        let node = this.nodeCache.get(id);
        if (!node) {
          node = {
            id: id,
            type: "html-template",
            point: signal({
              x: statement.position().xinPx,
              y: statement.position().yinPx,
            }),
            data: signal(statement),
          };
          this.nodeCache.set(id, node);
        }
        newNodes.push(node);
      }

      for (const id of this.nodeCache.keys()) {
        if (!currentIds.has(id)) {
          this.nodeCache.delete(id);
        }
      }

      nodesArray = newNodes;
      this.lastNodesArray = newNodes;
      this.lastNodeIds = currentIdsString;
    }

    // Update signals for all nodes
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const node = nodesArray[
        i
      ] as HtmlTemplateDynamicNode<AbstractStatementNode>;

      if (node.id !== statement.statement.id) {
        // Fallback if order mismatch
        this.lastNodeIds = "";
        return this.updateNodes(statements);
      }

      const newX = statement.position().xinPx;
      const newY = statement.position().yinPx;

      node.point.set({ x: newX, y: newY });

      if (node.data && node.data() !== statement) {
        node.data.set(statement);
      }
    }

    // Return the same array reference if structure hasn't changed to avoid re-triggering VFlow
    return nodesArray;
  }

  private updateEdges(statements: AbstractStatementNode[]) {
    const structureHash = statements
      .map((s) => {
        const childrenIds = s.children.map((c) => c?.statement.id).join(",");
        const pre = s.precondition.getValue().condition;
        const post = s.postcondition.getValue().condition;
        return `${s.statement.id}:${childrenIds}:${pre}:${post}`;
      })
      .join("|");

    if (structureHash !== this.lastStructureHash) {
      this.edges = this.computeEdges(statements);
      this.lastStructureHash = structureHash;
    }
  }

  protected computeEdges(statements: AbstractStatementNode[]): Edge[] {
    const edges: Edge[] = [];

    /**
     * Currently we only use labels if there are conflicts between the conditions of parent and child statements that have just been reconnected
     * @param parent
     * @param child
     */
    function calculateEdgeLabel(
      parent: AbstractStatementNode,
      child: AbstractStatementNode,
    ): EdgeLabel | undefined {
      if (parent.checkConditionSync(child)) {
        return undefined;
      }
      return {
        type: "html-template",
        data: {
          parent: parent,
          child: child,
        },
      };
    }

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
            edgeLabels: {
              center: calculateEdgeLabel(parent, child),
            },
          });
        }
      });
    });
    return edges;
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
   * When the nodes are moved around in the editor by VFlow, save the new positions to the model.
   */
  handlePositionChange($event: NodePositionChange[]) {
    $event.forEach((change) => {
      this.statements()
        .find((node) => node.statement.id == change.id)
        ?.setPosition(change.point);
    });
  }

  handleEdgeSelect($event: EdgeSelectChange[]) {
    this.selectedEdges = $event;
  }

  deleteEdge() {
    this.selectedEdges.forEach((edgeChange) => {
      if (edgeChange.selected) {
        const { parent, child } = this.getNodesFromEdge(edgeChange);
        disconnectNodes(parent.data!(), child.data!());
      }
    });
    this.edges = this.computeEdges(this.statements());
  }

  createEdge(change: Connection) {
    const parent = this.nodes.find(
      (node) => node.id == change.source,
    ) as HtmlTemplateDynamicNode<AbstractStatementNode>;
    const child = this.nodes.find(
      (node) => node.id == change.target,
    ) as HtmlTemplateDynamicNode<AbstractStatementNode>;
    parent.data!().addChild(child.data!(), Number(change.sourceHandle));
    this.edges = this.computeEdges(this.statements());
  }

  private getNodesFromEdge(edgeChange: { id: string }) {
    const parentId = this.edges.find(
      (edge) => edge.id == edgeChange.id,
    )!.source;
    const childId = this.edges.find((edge) => edge.id == edgeChange.id)!.target;
    const parent = this.nodes.find(
      (node) => node.id == parentId,
    )! as HtmlTemplateDynamicNode<AbstractStatementNode>;
    const child = this.nodes.find(
      (node) => node.id == childId,
    )! as HtmlTemplateDynamicNode<AbstractStatementNode>;
    return { parent, child };
  }

  protected onTabOpen($event: boolean) {
    this.showResetButton = !$event;
  }

  protected resetNodePosition() {
    switch (this.sidemenu.settings.resetVariant) {
      case ResetVariant.ReingoldTilford:
        this.resetNodePositionsRT();
        break;
      case ResetVariant.Stacked:
        this.resetNodePositionsStacked();
        break;
      default:
        this.resetNodePositionsRT();
        break;
    }
  }

  protected resetNodePositionsRT(): void {
    const nodesSignal = this.treeService.generateStatementNodes();
    const nodes = nodesSignal(); // get current array
    if (nodes.length === 0) return;

    const NODE_WIDTH = 450;
    const NODE_HEIGHT = 300;
    const H_SPACING = 50;
    const V_SPACING = 200;

    const root = nodes.find((n) => n.parent === undefined);
    if (!root) return;

    const xMap = new Map<AbstractStatementNode, number>();
    const depthMap = new Map<AbstractStatementNode, number>();

    const definedChildren = (
      node: AbstractStatementNode,
    ): AbstractStatementNode[] =>
      node.children.filter((c): c is AbstractStatementNode => c !== undefined);

    let nextSlot = 0;
    const firstWalk = (node: AbstractStatementNode, depth: number) => {
      depthMap.set(node, depth);
      const children = definedChildren(node);
      if (children.length === 0) {
        xMap.set(node, nextSlot++);
        return;
      }
      for (const child of children) firstWalk(child, depth + 1);
      const left = xMap.get(children[0]);
      const right = xMap.get(children[children.length - 1]);
      xMap.set(node, (left! + right!) / 2);
    };

    const secondWalk = (node: AbstractStatementNode) => {
      const slot = xMap.get(node)!;
      const depth = depthMap.get(node)!;
      node.setPosition({
        x: slot * (NODE_WIDTH + H_SPACING),
        y: depth * (NODE_HEIGHT + V_SPACING),
      });
      for (const child of definedChildren(node)) secondWalk(child);
    };

    firstWalk(root, 0);
    secondWalk(root);

    this.treeService.refreshNodes();
  }

  //Stacked Algorhithm
  protected resetNodePositionsStacked(): void {
    const nodesSignal = this.treeService.generateStatementNodes();
    const nodes = nodesSignal();
    if (nodes.length === 0) return;

    const NODE_WIDTH = 300;
    const NODE_HEIGHT = 450;
    const H_SPACING = 50;
    const V_SPACING = 200;

    const layerMap = new Map<number, AbstractStatementNode[]>();

    const traverse = (node: AbstractStatementNode, depth: number) => {
      if (!layerMap.has(depth)) layerMap.set(depth, []);
      layerMap.get(depth)!.push(node);

      for (const child of node.children.filter(
        (c): c is AbstractStatementNode => c !== undefined,
      )) {
        traverse(child, depth + 1);
      }
    };

    const root = nodes.find((n) => n.parent === undefined);
    if (!root) return;

    traverse(root, 0);

    layerMap.forEach((layerNodes, depth) => {
      layerNodes.forEach((node, index) => {
        node.setPosition({
          x: index * (NODE_WIDTH + H_SPACING),
          y: depth * (NODE_HEIGHT + V_SPACING),
        });
      });
    });

    this.treeService.refreshNodes();
  }
}