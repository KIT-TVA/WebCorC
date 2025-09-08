import { Component } from "@angular/core";
import { Button } from "primeng/button";
import { DialogService } from "primeng/dynamicdialog";
import { SettingsComponent } from "../settings/settings.component";

@Component({
  selector: "app-settings-button",
  imports: [Button],
  providers: [DialogService],
  templateUrl: "./settings-button.component.html",
  styleUrl: "./settings-button.component.scss",
})
export class SettingsButtonComponent {
  constructor(public dialogService: DialogService) {}
  activateDialog() {
    this.dialogService.open(SettingsComponent, {
      header: "Settings",
      modal: true,
    });
  }
}
