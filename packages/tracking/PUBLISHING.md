# Publishing @afflo/track to npm

## One-time setup
```bash
npm login          # log in as your npm account
npm whoami         # confirm you're logged in
```

## Build & publish
```bash
cd packages/tracking
npm run build      # compiles TS → dist/
npm publish --access public
```

## After publishing — merchants install with:
```bash
npm install @afflo/track
```

Or via CDN (no install — uses the file in /public):
```html
<script src="https://your-domain.com/afflo.min.js"
        data-org="PROGRAM_ID"
        data-host="https://your-domain.com"></script>
```

## Bump version after changes
Edit `package.json` version field, then `npm run build && npm publish --access public`
