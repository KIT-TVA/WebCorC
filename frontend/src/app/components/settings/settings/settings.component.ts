import { Component } from "@angular/core";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Fieldset } from "primeng/fieldset";
import { Button } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { GlobalSettingsService } from "../../../services/global-settings.service";
import { NetworkProjectService } from "../../../services/project/network/network-project.service";

@Component({
  selector: "app-settings",
  imports: [ToggleSwitch, Fieldset, Button, FormsModule],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.scss",
})
export class SettingsComponent {
  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    public globalSettingsService: GlobalSettingsService,
    public networkService: NetworkProjectService,
  ) {}

  switchTheme() {
    const element = document.querySelector("html");
    console.log("theme", element);
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
}
