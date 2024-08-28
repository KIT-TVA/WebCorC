import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
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
export class FileEditorComponent implements AfterViewInit,OnDestroy {

  private _urn : string = ''
  private _viewInit : boolean = false
  
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

    if (this._urn == '') {
      this._urn = uniformRessourceName
      return
    }
    
    if (this.code !== '') {
      // save the current code outside of the component
      this.projectService.syncFileContent(this._urn, this.code)
    }
    
    // finally override the old urn 

    this._urn = uniformRessourceName
    this.loadContentFromFile()
  }

  public ngAfterViewInit(): void {
    this.loadContentFromFile()
    this._viewInit = true
  
  }

  public ngOnDestroy(): void {
    this.projectService.syncFileContent(this._urn, this.code)
    this._viewInit = false
  }

  private loadContentFromFile() {
    let newCode =  this.projectService.getFileContent(this._urn) as string
    if (newCode) {
      this.code = newCode 
    } else {
      this.code = ""
    }
  }
}
