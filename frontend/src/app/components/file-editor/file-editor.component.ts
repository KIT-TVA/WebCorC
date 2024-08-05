import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NuMonacoEditorModule } from '@ng-util/monaco-editor';
import { FormsModule } from '@angular/forms';

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
  
  public code : string = 'package edu.informatics.tva; \npublic class Application { \n /** \n * Starts the application \n* @param args Should be empty \n */\npublic static void main(String[] args) { \n Micronaut.run(Application.class, args); \n}}';


  constructor() {}


  editorOptions =  {
      theme: 'vs',
      language: 'java',
      scrollBeyondLastLine: false,
  }


}
