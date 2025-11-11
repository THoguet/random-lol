import {
	ApplicationConfig,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection,
	isDevMode,
	importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { imageCacheInterceptor } from './interceptors/image-cache.interceptor';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule } from '@ngx-translate/core';

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideZonelessChangeDetection(),
		provideRouter(routes),
		provideClientHydration(withEventReplay()),
		provideHttpClient(withFetch(), withInterceptors([imageCacheInterceptor])),
		provideServiceWorker('ngsw-worker.js', {
			enabled: !isDevMode(),
			registrationStrategy: 'registerImmediately',
		}),
		// Provide ngx-translate through importProvidersFrom so it is available
		// for standalone component templates via the translate pipe.
		importProvidersFrom(TranslateModule.forRoot()),
		provideTranslateHttpLoader({
			prefix: '/assets/i18n/',
			suffix: '.json',
		}),
	],
};
