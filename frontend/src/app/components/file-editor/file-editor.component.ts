import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NuMonacoEditorModule } from '@ng-util/monaco-editor';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project/project.service';

@Component({
  selector: 'app-file-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NuMonacoEditorModule
  ],
  templateUrl: './file-editor.component.html',
  styleUrl: './file-editor.component.scss'
})
export class FileEditorComponent {

  private _urn : string = ''
  
  public code : string = '';


  constructor(private projectService : ProjectService) {}


  editorOptions =  {
      theme: 'vs',
      language: 'java',
      scrollBeyondLastLine: false,
  }

  @Input()
  set urn(uniformRessourceName: string) {
    // prevent reloading the same context
    if (uniformRessourceName == this._urn) {
      return
    }

    // save the current code 
    this.projectService.syncFileContent(this._urn, this.code)

    let newCode =  this.projectService.getFileContent(uniformRessourceName)
    if (newCode) {
      this.code = newCode
    } else {
      this.code = ""
    }

    // finally override the old urn 

    this._urn = uniformRessourceName
  }


}
