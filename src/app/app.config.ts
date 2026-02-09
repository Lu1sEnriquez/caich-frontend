import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Imports de PrimeNG v18
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/material';

import { routes } from './app.routes';
import { AuthInterceptor } from './core/services/auth.interceptor';
import { HttpErrorInterceptor } from './core/services/http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    
    // Animaciones (Vital para el Drawer)
    provideAnimationsAsync(),
    
    // Configuración de Tema (Vital para que se vea blanco y con estilo)
    providePrimeNG({ 
        theme: {
            preset: Aura, // Usamos el tema Aura
            options: {
                darkModeSelector: false, // Descomenta esto si quieres forzar SIEMPRE modo claro, ignorando el sistema
                cssLayer: {
                    name: 'primeng',
                    order: 'tailwind-base, primeng, tailwind-utilities'
                }
            }
        },
        ripple: true 
    })
  ]
};