import { Routes } from '@angular/router';
import {EditorComponent} from "./components/editor/editor.component";
import { FileEditorComponent } from './components/file-editor/file-editor.component';

export const routes: Routes = [
  {path: "", component: EditorComponent},
  {path: "file/editor", component: FileEditorComponent}
];
