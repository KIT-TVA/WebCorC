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
import {MacrosComponent} from "./macros/macros.component";
import { GlobalConditionsComponent } from './global-conditions/global-conditions.component';
import { SimpleStatementComponent } from './refinements/simple-statement/simple-statement.component';
import { ProjectService } from '../../services/project/project.service';

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

  private _urn : string = ''

  constructor(public treeService: TreeService, private projectService : ProjectService) {}


  @Input()
  set urn(uniformRessourceName : string) {
    // prevent reloading the same context

    if (uniformRessourceName == this._urn) {
      return
    }

  }

  
  ngAfterViewInit(): void {
    Refinement.resetIDs()
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
}
