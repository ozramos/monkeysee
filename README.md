# Monkeysee

> A drop-in library for adding face-controlled mouse pointers with computer vision via BRFv4 🙈

## Scripts

### With Yarn...
```bash
yarn init  # To update the package with your own labels
yarn       # and yarn --only=dev if you have a global NODE_ENV=production, the default on Windows.
yarn dev   # Development mode with SASS, templates, and hot-reload on localhost:8080
yarn build # Build the library
```

### ...or with NPM

```bash
npm init       # To update the package with your own labels
npm install    # and npm install --only=dev if you have a global NODE_ENV=production, the default on Windows.
npm run dev    # Development mode with SASS, templates, and hot-reload on localhost:8080
npm run build  # Build the library
```

## Development

The actual library is built with `/src/main.js` as the starting point. When people `npm install monkeysee` and `import monkeysee from 'monkeysee'`, they'll be loading this file.

The `/sandbox/` scripts are used when developing with `yarn dev` and are there to help you in developing your library (`/src/main.js`). Your library and `/sandbox/index.js` are automatically injected into `/sandbox/index.pug`. When you run `yarn build`, these files are included in the `/dist/` folder which allows you to quickly deploy examples with your library!

## !!! IMPORTANT !!!

Make sure the following are set, otherwise you may not publish/commit correctly:

- At a minimum, ensure that you changed the following `package.json` properties:
  - name
  - description
  - repository.url
  - author
- Make sure to remove this git repo as the origin with: `git remove origin`
