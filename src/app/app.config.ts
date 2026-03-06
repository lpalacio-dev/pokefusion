import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Router — withComponentInputBinding permite recibir route params como @Input()
    provideRouter(routes, withComponentInputBinding()),
    // HTTP — withFetch usa la Fetch API nativa en lugar de XHR
    provideHttpClient(withFetch()),
  ]
};
