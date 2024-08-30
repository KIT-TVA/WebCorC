import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInput, MatInputModule} from "@angular/material/input";
import {Condition} from "../../../../types/condition/condition";
import {GridTileBorderDirective} from "../../../../directives/grid-tile-border.directive";
import {GridTileHeaderDirective} from "../../../../directives/grid-tile-header.directive";
import {MatGridListModule} from "@angular/material/grid-list";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatMenuModule, MatMenuTrigger} from "@angular/material/menu";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'condition-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, GridTileBorderDirective, GridTileHeaderDirective, MatGridListModule, ReactiveFormsModule, MatAutocompleteModule, MatMenuModule, MatButtonModule],
  templateUrl: './condition-editor.component.html',
  styleUrl: './condition-editor.component.scss'
})
export class ConditionEditorComponent implements OnInit {
  @Input() condition!: Condition;
  @Input() editable = true;
  @Output() conditionEditingFinished: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild("input", {read: MatInput}) input!: MatInput;

  conditionGroup: FormGroup | undefined;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    // Set up form group on init, since here the @Inputs available
    this.conditionGroup = this.fb.group({
      condition: ""
    });
    this.conditionGroup.get("condition")!.setValue(this.condition.content);
    if (!this.editable) {
      this.conditionGroup.get("condition")!.disable();
    }

    // Update condition object's content if the input changes
    this.conditionGroup.valueChanges.subscribe(value => this.condition.content = value.condition);

    // Listen for updates from other input forms for this condition
    this.condition.contentChangeObservable.subscribe(value => {
      console.log(value)
      if (value !== this.conditionGroup!.get("condition")!.value) {
        console.log(value)
        this.conditionGroup!.get("condition")!.setValue(value);
      }
    });
  }

  insertSymbol(symbol: string): void {
    const inp: HTMLInputElement = document.getElementById(this.input.id) as HTMLInputElement;
    const currentValue = this.conditionGroup!.get("condition")!.value;
    this.conditionGroup!.get("condition")!.setValue(
      currentValue.substring(0, inp.selectionStart) + symbol + currentValue.substring(inp.selectionEnd));
    this.input.focus();
  }
}
