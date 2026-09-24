import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConditionEditorComponent } from "./condition-editor.component";
import { Condition, ICondition } from "../../../../types/condition/condition";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideHttpClient } from "@angular/common/http";
import { BehaviorSubject } from "rxjs";
import {
  GREEN_COLOURED_CONDITIONS,
  RED_COLOURED_CONDITIONS,
} from "../../editor.component";

describe("ConditionEditorComponent", () => {
  let component: ConditionEditorComponent;
  let fixture: ComponentFixture<ConditionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConditionEditorComponent],
      providers: [
        provideHttpClient(),
        provideAnimations(),
        { provide: GREEN_COLOURED_CONDITIONS, useValue: [] },
        { provide: RED_COLOURED_CONDITIONS, useValue: [] },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConditionEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      "condition",
      new BehaviorSubject<ICondition>(new Condition("")),
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
