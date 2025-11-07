import { HttpInterceptorFn } from '@angular/common/http';

/**
 * HTTP interceptor that adds cache-control headers for image requests
 * to enable browser caching of champion icons and other images.
 */
export const imageCacheInterceptor: HttpInterceptorFn = (req, next) => {
	// Check if the request is for an image
	const isImageRequest =
		req.url.includes('.png') ||
		req.url.includes('.jpg') ||
		req.url.includes('.jpeg') ||
		req.url.includes('.webp') ||
		req.url.includes('.gif') ||
		req.url.includes('/champion/') ||
		req.url.includes('ddragon.leagueoflegends.com');

	if (isImageRequest) {
		// Clone the request to add cache headers
		const cachedReq = req.clone({
			setHeaders: {
				'Cache-Control': 'public, max-age=86400, immutable',
			},
		});
		return next(cachedReq);
	}

	return next(req);
};
