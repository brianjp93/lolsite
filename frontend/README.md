# hardstuck.club frontend

Vite/React frontend served by Django.

```bash
npm install
npm run dev
npm run build
```

During development, run Vite on port 3000 and open Django on port 8000. Django uses `REACT_PROXY_URL` to load Vite's client and entry module. Production builds are read from `dist/.vite/manifest.json` and collected as Django static files.

Routes are defined in `src/router.tsx`; this project does not use file-based routing.
