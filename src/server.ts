import {
	AngularNodeAppEngine,
	createNodeRequestHandler,
	isMainModule,
	writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { MultiplayerServer } from './server/multiplayer.server';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const httpServer = createServer(app);
const angularApp = new AngularNodeAppEngine();

// Initialize multiplayer server
const multiplayerServer = new MultiplayerServer(httpServer);

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Proxy API requests to external CDN to avoid CORS issues
 */
const championProxy = createProxyMiddleware({
	target: 'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json',
	changeOrigin: true,
	pathRewrite: {
		'^.*': '',
	},
});

app.use('/api/champions', championProxy);

// Fetch champion data for multiplayer server
fetch('https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json')
	.then((response) => response.json())
	.then((champions) => {
		multiplayerServer.setChampionData(champions);
	})
	.catch((error) => {
		console.error('Failed to fetch champion data:', error);
	});

/**
 * Serve static files from /browser
 */
app.use(
	express.static(browserDistFolder, {
		maxAge: '1y',
		index: false,
		redirect: false,
	}),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
	angularApp
		.handle(req)
		.then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
		.catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
	const port = process.env['PORT'] || 4000;
	httpServer.listen(port, () => {
		console.log(`Node Express server listening on http://localhost:${port}`);
		console.log(`WebSocket server initialized for multiplayer`);
	});
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
