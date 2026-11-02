import { ApplicationConfig } from "@angular/core";
import { provideRouter, withComponentInputBinding } from "@angular/router";

import { routes } from "./app.routes";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideOptimus } from "@openng/optimus-ui/config";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { Noir } from "./style";

export const appConfig: ApplicationConfig = {
  providers: [
    /**
     * routes from app.routes.ts, withComponentInputBinding() is needed for passing the file urns to the editors
     */
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideAnimations(),
    provideAnimationsAsync(),
    provideOptimus({
      theme: {
        preset: Noir,
        options: {
          darkModeSelector: ".dark-mode",
          cssLayer: {
            name: "optimus",
            order: "theme, base, optimus",
          },
        },
      },
    }),
  ],
};
