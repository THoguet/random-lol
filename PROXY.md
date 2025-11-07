# Proxy Configuration

This project uses a proxy to avoid CORS issues when fetching champion data from the Meraki Analytics CDN.

## Architecture

### Development (`ng serve`)
- Uses `proxy.conf.json` configuration
- Angular CLI dev server handles the proxy
- Requests to `/api/champions` are forwarded to the external CDN

### Production/SSR (`ng build` + `npm run serve:ssr:random-lol`)
- Uses `http-proxy-middleware` in `src/server.ts`
- Express server handles the proxy
- Same endpoint `/api/champions` works consistently

## How It Works

1. **Frontend** makes a request to `/api/champions` (relative URL)
2. **Proxy layer** (dev server or Express) intercepts the request
3. **External API** at `https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json` is called
4. **Response** is returned to the frontend as if it came from the same origin

## Benefits

- ✅ No CORS issues in development or production
- ✅ Consistent API endpoint across environments
- ✅ External API URL changes only need updates in proxy config
- ✅ Can add caching, rate limiting, or other middleware later

## Testing

### Development
```bash
npm start
# Visit http://localhost:4200
```

### Production SSR
```bash
npm run build
npm run serve:ssr:random-lol
# Visit http://localhost:4000
```

## Configuration Files

- `proxy.conf.json` - Development proxy configuration
- `src/server.ts` - Production SSR proxy implementation
- `angular.json` - References proxy config for `ng serve`
