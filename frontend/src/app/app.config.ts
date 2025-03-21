import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch } from '@angular/common/http';


export const appConfig: ApplicationConfig = {
  providers: [
    /**
     * routes from app.routes.ts, withComponentInputBinding() is needed for passing the file urns to the editors
     */
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch()
    ), 
    provideAnimations()
  ],
};
