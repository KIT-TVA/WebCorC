import {ApplicationConfig} from '@angular/core';
import {provideRouter, withComponentInputBinding} from '@angular/router';

import {routes} from './app.routes';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideHttpClient, withFetch} from '@angular/common/http';
import {providePrimeNG} from "primeng/config";
import {provideAnimationsAsync} from "@angular/platform-browser/animations/async";
import Aura from '@primeuix/themes/aura';

export const appConfig: ApplicationConfig = {
    providers: [
        /**
         * routes from app.routes.ts, withComponentInputBinding() is needed for passing the file urns to the editors
         */
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(
            withFetch()
        ),
        provideAnimations(),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura
            }
        })
    ],
};
