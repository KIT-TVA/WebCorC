import { Component, inject } from "@angular/core";
import { Button } from "primeng/button";
import { DialogService } from "primeng/dynamicdialog";
import { SettingsComponent } from "../settings/settings.component";

@Component({
  selector: "app-settings-button",
  imports: [Button],
  providers: [DialogService],
  templateUrl: "./settings-button.component.html",
  styleUrl: "./settings-button.component.css",
})
export class SettingsButtonComponent {
  dialogService = inject(DialogService);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}
  activateDialog() {
    this.dialogService.open(SettingsComponent, {
      header: "Settings",
      modal: true,
      closable: true,
    });
  }
}
