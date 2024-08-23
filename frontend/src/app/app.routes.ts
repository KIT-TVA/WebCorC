import { Routes } from '@angular/router';
import {EditorComponent} from "./components/editor/editor.component";
import { FileEditorComponent } from './components/file-editor/file-editor.component';
import { LandingPageComponent } from './landing-page/landing-page.component';

export const routes: Routes = [
  {path: "", component: LandingPageComponent},
  {path: "editor/diagramm/:urn", component: EditorComponent},
  {path: "editor/file/:urn", component: FileEditorComponent}
];
