import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";

import {
  ConditionEditorComponent,
  SYNTAX_CHECK_DELAY_MS,
} from "./condition-editor.component";
import { Condition, ICondition } from "../../../../types/condition/condition";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideHttpClient } from "@angular/common/http";
import { BehaviorSubject } from "rxjs";
import {
  GREEN_COLOURED_CONDITIONS,
  RED_COLOURED_CONDITIONS,
} from "../../editor.component";

type Editor = ComponentFixture<ConditionEditorComponent>;

describe("ConditionEditorComponent", () => {
  let fixture: Editor;
  let allEditors: Editor[];

  const createEditor = (condition: BehaviorSubject<ICondition>): Editor => {
    const editor = TestBed.createComponent(ConditionEditorComponent);
    editor.componentRef.setInput("condition", condition);
    editor.detectChanges();
    allEditors.push(editor);
    return editor;
  };

  const setCondition = (text: string) => {
    const condition = new BehaviorSubject<ICondition>(new Condition(text));
    fixture.componentRef.setInput("condition", condition);
    fixture.detectChanges();
    return condition;
  };

  /** Types into the editor, followed by the change detection of the application */
  const type = (editor: Editor, text: string) => {
    editor.componentInstance.onConditionChange(text);
    allEditors.forEach((e) => e.detectChanges());
  };

  const shownError = (editor: Editor = fixture): string | null => {
    editor.detectChanges();
    return (
      editor.nativeElement
        .querySelector(".condition-syntax-error")
        ?.textContent.trim() ?? null
    );
  };

  const textareaIsInvalid = (): boolean =>
    fixture.nativeElement
      .querySelector("textarea")
      .classList.contains("p-invalid");

  const leaveField = (editor: Editor) =>
    editor.nativeElement
      .querySelector("textarea")
      .dispatchEvent(new FocusEvent("focusout", { bubbles: true }));

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
    allEditors = [fixture];
  });

  it("should create", () => {
    setCondition("");
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("shows no error for an empty condition", () => {
    setCondition("");
    expect(shownError()).toBeNull();
    expect(textareaIsInvalid()).toBeFalse();
  });

  it("shows no error for a valid condition", () => {
    setCondition("A.length > 0 && i == 0");
    expect(shownError()).toBeNull();
    expect(textareaIsInvalid()).toBeFalse();
  });

  it("shows only the message of the error", () => {
    setCondition("a > b c");
    expect(shownError()).toBe(
      "Unexpected 'c', expected an operator or the end of the condition",
    );
  });

  it("shows the error of an invalid condition immediately after loading", () => {
    setCondition("a > b c");
    expect(shownError()).not.toBeNull();
    expect(textareaIsInvalid()).toBeTrue();
  });

  it("does not check the syntax if validation is disabled", () => {
    fixture.componentRef.setInput("validateJml", false);
    setCondition("i = i + 1;");
    expect(shownError()).toBeNull();
    expect(textareaIsInvalid()).toBeFalse();
  });

  it("shows the error of typed text after a pause", fakeAsync(() => {
    setCondition("");
    type(fixture, "a >");
    expect(shownError()).toBeNull();

    tick(SYNTAX_CHECK_DELAY_MS - 1);
    expect(shownError()).toBeNull();

    tick(1);
    expect(shownError()).toBe(
      "Unexpected end of condition, expected an expression",
    );
  }));

  it("restarts the delay on each typed character", fakeAsync(() => {
    setCondition("");
    type(fixture, "a >");
    tick(SYNTAX_CHECK_DELAY_MS - 100);
    type(fixture, "a > (");
    tick(SYNTAX_CHECK_DELAY_MS - 100);
    expect(shownError()).toBeNull();

    tick(100);
    expect(shownError()).toContain("expected an expression");
  }));

  it("removes the error immediately when the typed text is valid", fakeAsync(() => {
    setCondition("a >");
    expect(shownError()).not.toBeNull();

    type(fixture, "a > b");
    expect(shownError()).toBeNull();
    expect(textareaIsInvalid()).toBeFalse();
  }));

  it("shows the error immediately when leaving the field", fakeAsync(() => {
    setCondition("");
    type(fixture, "a >");
    leaveField(fixture);
    expect(shownError()).toContain("expected an expression");
    tick(SYNTAX_CHECK_DELAY_MS);
  }));

  it("updates the condition when typing", () => {
    const condition = setCondition("");
    type(fixture, "a > b");
    expect(condition.getValue().condition).toBe("a > b");
  });

  // e.g. intermediate condition of a composition and postcondition of its first statement
  for (const sharing of ["subject", "condition object"]) {
    describe(`with a condition shared between editors by the ${sharing}`, () => {
      let typingEditor: Editor;
      let otherEditor: Editor;

      beforeEach(() => {
        const condition = new Condition("i == 0");
        const subject = new BehaviorSubject<ICondition>(condition);
        typingEditor = createEditor(subject);
        otherEditor = createEditor(
          sharing === "subject"
            ? subject
            : new BehaviorSubject<ICondition>(condition),
        );
      });

      it("shows the error of typed text in all editors after the same pause", fakeAsync(() => {
        type(typingEditor, "i = 0");
        tick(SYNTAX_CHECK_DELAY_MS - 1);
        expect(shownError(typingEditor)).toBeNull();
        expect(shownError(otherEditor)).toBeNull();

        tick(1);
        expect(shownError(typingEditor)).toContain("Assignment '='");
        expect(shownError(otherEditor)).toContain("Assignment '='");
      }));

      it("removes the error in all editors immediately when fixed", fakeAsync(() => {
        type(typingEditor, "i = 0");
        tick(SYNTAX_CHECK_DELAY_MS);
        type(typingEditor, "i == 0");
        expect(shownError(typingEditor)).toBeNull();
        expect(shownError(otherEditor)).toBeNull();
      }));

      it("shows the error in all editors immediately when leaving the field", fakeAsync(() => {
        type(typingEditor, "i = 0");
        leaveField(typingEditor);
        expect(shownError(typingEditor)).toContain("Assignment '='");
        expect(shownError(otherEditor)).toContain("Assignment '='");
        tick(SYNTAX_CHECK_DELAY_MS);
      }));

      it("does not affect editors of other conditions when leaving the field", fakeAsync(() => {
        const unrelatedEditor = createEditor(
          new BehaviorSubject<ICondition>(new Condition("a > b")),
        );
        type(unrelatedEditor, "a >");
        type(typingEditor, "i = 0");
        leaveField(typingEditor);
        expect(shownError(unrelatedEditor)).toBeNull();
        tick(SYNTAX_CHECK_DELAY_MS);
        expect(shownError(unrelatedEditor)).not.toBeNull();
      }));
    });
  }
});
