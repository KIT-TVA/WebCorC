import { Component } from "@angular/core";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Fieldset } from "primeng/fieldset";
import { Button } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { GlobalSettingsService } from "../../../services/global-settings.service";
import { NetworkProjectService } from "../../../services/project/network/network-project.service";
import { ProjectService } from "../../../services/project/project.service";
import { Dialog } from "primeng/dialog";
import { prettyPrintJson } from "pretty-print-json";
import { TreeService } from "../../../services/tree/tree.service";
import { ResetVariant } from "../../../types/ResetVariant";
import { MatRadioButton, MatRadioGroup } from "@angular/material/radio";

@Component({
  selector: "app-settings",
  imports: [ToggleSwitch, Fieldset, Button, FormsModule, Dialog, MatRadioGroup, MatRadioButton],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.css",
})
export class SettingsComponent {
  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    public globalSettingsService: GlobalSettingsService,
    public networkService: NetworkProjectService,
    protected projectService: ProjectService,
    protected treeService: TreeService,
  ) {}

  //Note: this is not the current dialog, but used to display json dumps
  protected dialogVisible: boolean = false;
  protected dialogContent = prettyPrintJson.toHtml({});

  switchTheme() {
    const element = document.querySelector("html");
    element?.classList.toggle("dark-mode");
  }

  isDarkModeEnabled() {
    const element = document.querySelector("html");
    return element?.classList.contains("dark-mode");
  }

  resetProjectId() {
    this.networkService.projectId = undefined;
    localStorage.clear();
    sessionStorage.clear();
  }

  dumpProjectService() {
    this.dialogContent = prettyPrintJson.toHtml(this.projectService.dump());
    this.dialogVisible = true;
  }

  dumpTreeService() {
    this.dialogContent = prettyPrintJson.toHtml(this.treeService.dump());
    this.dialogVisible = true;
  }

  protected readonly ResetVariant = ResetVariant;
}
