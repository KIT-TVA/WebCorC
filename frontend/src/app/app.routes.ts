import { Routes } from '@angular/router';
import {EditorComponent} from "./components/editor/editor.component";
import { FileEditorComponent } from './components/file-editor/file-editor.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { NotFoundErrorPageComponent } from './components/not-found-error-page/not-found-error-page.component';

/**
 * Mapping from path to components to fill the page excluding the top bar
 */
export const routes: Routes = [
  {path: "", component: LandingPageComponent},
  {path: "editor/diagram/:urn", component: EditorComponent},
  {path: "editor/file/:urn", component: FileEditorComponent},
  {path: "**", pathMatch: "full" ,component: NotFoundErrorPageComponent}
];