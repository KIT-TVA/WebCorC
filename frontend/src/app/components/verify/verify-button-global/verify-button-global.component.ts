import {
  Component,
  Signal,
  computed,
  signal,
  inject,
} from "@angular/core";
import { CreateProjectDialogComponent } from "../../project-explorer/create-project-dialog/create-project-dialog.component";
import { TreeService } from "../../../services/tree/tree.service";
import { NetworkJobService } from "../../../services/tree/network/network-job.service";
import { DialogService } from "primeng/dynamicdialog";
import { ProjectService } from "../../../services/project/project.service";
import { GlobalSettingsService } from "../../../services/global-settings.service";
import { ConfirmationService, MenuItem, MessageService } from "primeng/api";
import { SplitButton } from "primeng/splitbutton";
import { Button } from "primeng/button";
import { VerifierService } from "../../../services/verifier/verifier.service";
import { ConsoleService } from "../../../services/console/console.service";

/**
 * The currently selected verify mode. Unlike the {@link VerifyOptions} menu items (whose
 * `label` must be a plain string for the split button), the state's `label` is a reactive
 * signal so the button caption can track live data such as the verifier counts.
 */
type VerifyState = { id: string; label: Signal<string> };

/**
 * The global Verify button.
 * Uses {@link NetworkJobService} to verify the root formula of the current file.
 */
@Component({
  selector: "app-verify-button-global",
  imports: [SplitButton, Button],
  templateUrl: "./verify-button-global.component.html",
  styleUrl: "./verify-button-global.component.css",
})
export class VerifyButtonGlobalComponent {
  private treeService = inject(TreeService);
  private networkTreeService = inject(NetworkJobService);
  private dialogService = inject(DialogService);
  private projectService = inject(ProjectService);
  private globalSettingsService = inject(GlobalSettingsService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private verifierService = inject(VerifierService);
  private readonly consoleService = inject(ConsoleService);

  /**
   * The label of the "Verify all" option, annotated with the live verifier counts.
   * Recomputes whenever the verifier list changes.
   */
  private readonly verifyAllLabel: Signal<string> = computed(() => {
    const verifiers = this.verifierService.verifiers();
    const active = verifiers.filter((verifier) => verifier.enabled).length;
    return `Verify (${active}/${verifiers.length})`;
  });

  private _verifyOptions: MenuItem[] = [
    {
      id: "all",
      label: "Verify all",
      command: () => this.updateVerifyButtonState("all"),
    },
    {
      id: "functional",
      label: "Verify only functional",
      command: () => this.updateVerifyButtonState("functional"),
    },
  ];

  private _verifyStates: VerifyState[] = [
    { id: "all", label: this.verifyAllLabel },
    { id: "functional", label: signal("Verify functional") },
  ];

  /**
   * The selected verify mode, derived from the shared functional-only flag in
   * {@link VerifierService} so per-statement verification uses the same selection.
   */
  private _verifyButtonState: Signal<VerifyState> = computed(() => {
    const id = this.verifierService.functionalOnly() ? "functional" : "all";
    return this._verifyStates.find((state) => state.id === id)!;
  });

  /**
   * Triggered on pressing the verify Button.
   * Sideeffect: When there are unsaved changes and no backend project connected prompt user to save before verifying.
   * This is needed for the backend to verify the contents of the project.
   */
  public verify(): void {
    this.treeService.finalizeStatements();
    if (!this.verifierService.verifiersValid()) {
      this.confirmationService.confirm({
        message:
          "Some verifier settings are invalid. Please correct them before verifying or switch to functional verification. For more information see the console.",
        header: "Invalid Verifier Settings",
        icon: "pi pi-exclamation-triangle",
        rejectVisible: false,
        acceptButtonProps: { label: "OK" },
      });

      this.consoleService.addStringError(
        JSON.stringify(this.verifierService.invalidVerifierSettings, null, 2),
        "Invalid verifier settings",
      );
      return;
    }
    if (this.projectService.shouldCreateProject) {
      this.confirmationService.confirm({
        message:
          "You have unsaved changes. Do you want to save them before verifying?",
        header: "Unsaved Changes",
        icon: "pi pi-exclamation-triangle",
        accept: () => {
          this.openNewProjectDialog()?.onClose.subscribe((created) => {
            if (created) {
              this.projectService.uploadWorkspace().then(() => {
                this.messageService.add({
                  summary: "Save successful",
                  severity: "success",
                });
                this.verify();
              });
            } else {
              this.messageService.add({
                summary: "Save cancelled",
                detail: "No project specified to save to",
                severity: "warn",
              });
            }
          });
        },
        reject: () => {
          this.treeService.beginRun();
          this.globalSettingsService.isVerifying = true;
          this.networkTreeService.verify(
            this.treeService.rootFormula,
            this.projectService.projectId,
            this.treeService.urn,
            this.verifierService.functionalOnly(),
          );
        },
      });
    } else {
      this.treeService.beginRun();
      this.globalSettingsService.isVerifying = true;
      this.networkTreeService.verify(
        this.treeService.rootFormula,
        this.projectService.projectId,
        this.treeService.urn,
        this.verifierService.functionalOnly(),
      );
    }
  }

  /**
   * Opens the dialog to create a new backend project.
   */
  private openNewProjectDialog() {
    return this.dialogService.open(CreateProjectDialogComponent, {
      header: "Select Project",
      modal: true,
    });
  }

  protected updateVerifyButtonState(id: string) {
    this.verifierService.setFunctionalOnly(id === "functional");
  }

  /**
   * Disabled when no root formula exists or verification is in progress.
   */
  protected get isDisabled(): boolean {
    return (
      !this.treeService.rootFormula || this.globalSettingsService.isVerifying
    );
  }

  /**
   * Whether a verification is currently in progress, used for the Button loading state.
   */
  protected get isVerifying(): boolean {
    return this.globalSettingsService.isVerifying;
  }

  /**
   * Verification options for the split button menu, with check icons and alignment placeholders.
   */
  public readonly verifyOptions: Signal<MenuItem[]> = computed(() => {
    const selectedId = this._verifyButtonState().id;
    return this._verifyOptions.map((option) => {
      const selected = option.id === selectedId;
      return {
        ...option,
        icon: selected ? "pi pi-check" : "pi pi-fw",
        styleClass: selected ? "selected-verify-option" : undefined,
      };
    });
  });

  /**
   * Whether the mode dropdown is offered: only with a non-functional Verifier enabled, since
   * otherwise both modes run the same job. Hiding it leaves the selected mode untouched.
   */
  public readonly showModeDropdown: Signal<boolean> = computed(
    () => this.verifierService.enabledNonFunctionalVerifierIds.length > 0,
  );

  /**
   * The label shown on the split button itself, reflecting the selected option and, for
   * "all", the live verifier counts.
   */
  public readonly verifyButtonLabel: Signal<string> = computed(() =>
    this._verifyButtonState().label(),
  );
}
