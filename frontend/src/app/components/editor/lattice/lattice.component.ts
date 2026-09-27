import { AfterViewInit, Component, OnDestroy } from "@angular/core";

import { TreeService } from "../../../services/tree/tree.service";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatListModule } from "@angular/material/list";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FloatLabel } from "primeng/floatlabel";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { $dt } from "@primeuix/themes";
import { InputText } from "primeng/inputtext";
import { Subscription } from "rxjs";
import { DividerModule } from "primeng/divider";
import { Button } from "primeng/button";
import { IFbCService } from "../../../services/ifbc/ifbc.service";
import { MultiSelect } from "primeng/multiselect"
import { Message } from "primeng/message";
import { ILatticeLevel, LatticeLevel } from "../../../types/ifbc/lattice";

/**
 * Component to edit the variables of the file.
 * Uses {@link TreeService} to manage and persist the variables
 * @link https://material.angular.io/components/form-field/overview
 * @link https://angular.dev/guide/forms/reactive-forms
 */
@Component({
  selector: "lattice",
  imports: [
    FormsModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    FloatLabel,
    IconField,
    InputIcon,
    InputText,
    DividerModule,
    Button,
    MultiSelect,
    Message
],
  templateUrl: "./lattice.component.html",
  standalone: true,
  styleUrl: "./lattice.component.css",
})
export class LatticeComponent implements AfterViewInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  /**
   * Forms Template
   */
  private _levels: FormGroup = this._fb.group({
    newLevel: new FormControl("", []),
    items: this._fb.array([]),
  });

  private _latticeSaveEnabled = true;
  private _latticeSaveDisabledReason = "";

  public constructor(
    private _fb: FormBuilder,
    public treeService: TreeService,
    private latticeService: IFbCService
  ) {}
  ngAfterViewInit(): void {
    this.latticeService.confidentialityLattice.subscribe((lattice) => {
      this.items.clear()
      lattice.levels.forEach((level) => {
          const _level = this._fb.group({
            name: new FormControl(level.name, [Validators.required]),
            id: new FormControl(level.id, [Validators.required]),
            parents: new FormControl(
              level.parents(lattice).map(parent => parent.id),
              Validators.required
            )
          });
          // Subscribe per-level to not handle updates to the name of a lattice.
          // If the name changes, the correctness of the lattice does not as we use ids.
          _level.get('parents')?.valueChanges.subscribe((level) => {
            // defer the update such that the form array has updated values.
            // Otherwise the old values would be used, resulting in incorrect state.
            queueMicrotask(() => {
              this.handleLatticeUpdate()
            })
          })
          this.items.push(_level);
      })
      this.handleLatticeUpdate();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private handleLatticeUpdate() {
    this.latticeService.validateLattice(this.levels).subscribe({
      next: x => {
        this._latticeSaveDisabledReason = "";
        this._latticeSaveEnabled = true;
      },
      error: e => {
        this._latticeSaveDisabledReason = e.error.error;
        this._latticeSaveEnabled = false;
      }
    })
  }


  /**
   * Adds new level and check for duplicate names
   */
  public addLevel(): void {
    const value: string = this.variables.controls["newLevel"].value;

    if (!value) {
      return;
    }

    // if (!this.treeService.addVariable(value, "LOCAL")) {
    //   this.variables.controls["newVariable"].reset();
    //   return;
    // }

    const level = this._fb.group({
      name: new FormControl(value, [Validators.required]),
      id: this.items.length,
      parents: new FormControl([], [Validators.required])
    });

    this.items.push(level);
    this.handleLatticeUpdate();
    this.variables.controls["newLevel"].reset();
  }

  /**
   * Eventlistener triggered on pressing deleting key in the form
   * @param index
   */
  public deleteLevel(index: number): void {
    const id = this.items.value[index].id as number;
    this.items.removeAt(index);
    for (const level of this.items.value) {
      level.parents = level.parents.filter((p: number) => p !== id);
    }
    this.handleLatticeUpdate();
  }

  /**
   * Eventlistener triggered on pressing enter key in the form
   * @param event
   */
  public onEnter(event: Event) {
    event.preventDefault();
    this.addLevel();
  }

  public get items(): FormArray {
    return this.variables.controls["items"] as FormArray;
  }

  public get levels(): ILatticeLevel[] {
    return (this.items.value as { name: string; id: number; parents: number[]}[]).map(({ name, id, parents}) => new LatticeLevel(id, name, parents))
  }

  public get variables(): FormGroup {
    return this._levels;
  }

  public levelsWithout(index: number): { name: string, parents: number[]}[] {
    return [...this.items.value.slice(0, index), ...this.items.value.slice(index + 1)]
  }

  public get latticeSaveEnabled(): boolean {
    return this._latticeSaveEnabled;
  }

  public get latticeSaveDisabledReason(): string {
    return this._latticeSaveDisabledReason;
  }
  public get dirtyState(): boolean {
    return !(
      this._levels.controls["newVariable"].value == null ||
      this._levels.controls["newVariable"].value == ""
    );
  }

  public saveLattice() {
    this.latticeService.saveConfidentialityLattice(this.levels)
  }

  protected readonly $dt = $dt;
}
