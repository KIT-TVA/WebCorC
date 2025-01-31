import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NuMonacoEditorModule } from '@ng-util/monaco-editor';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project/project.service';
import { Router } from '@angular/router';
import { EditorService } from '../../services/editor/editor.service';
/**
 * Simple wrapper around the nu-monaco text editor, which saves and loads the file content from the {@link ProjectService}
 * This component is mapped under the url /editor/file/{urn}
 * @link https://www.npmjs.com/package/@ng-util/monaco-editor
 */
@Component({
    selector: 'app-file-editor',
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
  
  public code : string = ''

  public constructor(private projectService : ProjectService, private editorService : EditorService, private router : Router) {
    this.projectService.editorNotify.subscribe(() => {
      this.saveContentToFile()
    })
  }

  //Todo: make language configurable
  public editorOptions =  {
      theme: 'vs',
      language: 'java',
      scrollBeyondLastLine: false,
  }

  /**
   * Allows with the configuration of the app paths in @see app.routes.ts to inject path variables from the url
   * to this component 
   */
  @Input()
  public set urn(uniformRessourceName: string) {
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
    this.editorService.currentFileName = uniformRessourceName.substring(uniformRessourceName.lastIndexOf('/'))
    this.loadContentFromFile()
  }

  public ngAfterViewInit(): void {
    this.loadContentFromFile()
    this._viewInit = true
    this.projectService.editorNotify.subscribe(() => {
      this.saveContentToFile()
    })
  
  }

  public ngOnDestroy(): void {
    this.projectService.syncFileContent(this._urn, this.code)
    this._viewInit = false
  }

  private async loadContentFromFile() {
    let newCode : string | undefined = undefined 
    try {
      newCode = await this.projectService.getFileContent(this._urn) as string
    } catch {
      const projectId = this.router.parseUrl(this.router.url).queryParamMap.get("projectId")
      if (!this.projectService.projectId && projectId) {
        this.projectService.projectId = projectId
        
        this.projectService.dataChange.subscribe(async () => {
          newCode = await this.projectService.getFileContent(this._urn) as string
          this.loadContentFromFile()
        })

        this.projectService.downloadWorkspace()
      }
    }

    if (this._urn.endsWith(".java")) {
      this.editorOptions = { theme : 'vs', language : 'java', scrollBeyondLastLine: false}
    } else {
      this.editorOptions = { theme : 'vs', language : 'plaintext', scrollBeyondLastLine: false}
    }

    if (newCode) {
      this.code = newCode 
    } else {
      this.code = ""
    }

  }

  private saveContentToFile() : void {
    this.projectService.syncFileContent(this._urn, this.code)
  }
}
