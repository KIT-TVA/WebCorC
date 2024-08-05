import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatDrawer, MatSidenavModule} from "@angular/material/sidenav";
import {FormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {TreeService} from "./services/tree/tree.service";
import {MatButtonModule} from "@angular/material/button";
import {MatDialog} from "@angular/material/dialog";
import {VerificationResultComponent} from "./dialogs/verification-result.component";
import {CodegenComponent} from "./dialogs/codegen.component";
import { ProjectExplorerComponent } from "./components/project-explorer/project-explorer.component";
import { MatIconModule } from '@angular/material/icon';
import { NuMonacoEditorModule } from '@ng-util/monaco-editor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatToolbarModule, MatSidenavModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, ProjectExplorerComponent, MatIconModule, NuMonacoEditorModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(public treeService: TreeService, private dialog: MatDialog) {}

  verify(): void {
    if (this.treeService.rootNode) {
      const verificationResult = this.treeService.verify(this.treeService.rootNode!);
      verificationResult.then(result => {
        this.dialog.open(VerificationResultComponent, {data: {result}});
      });
    }
  }

  openGenerateCodeDialog(): void {
    this.dialog.open(CodegenComponent, {minWidth: "350px", height: "300px"});
  }

  export(): void {
    this.treeService.downloadJSON();
  }
}
