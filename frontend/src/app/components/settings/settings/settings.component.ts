import { Component } from "@angular/core";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Fieldset } from "primeng/fieldset";
import { Button } from "primeng/button";

@Component({
  selector: "app-settings",
  imports: [ToggleSwitch, Fieldset, Button],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.scss",
})
export class SettingsComponent {
  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {}

  switchTheme() {
    const element = document.querySelector("html");
    console.log("theme", element);
    element?.classList.toggle("dark-mode");
  }
}
