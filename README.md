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

## License
Uses BRFv4: https://github.com/Tastenkunst/brfv4_javascript_examples
Uses Haar Cascade: haarcascade_frontalface_default.xml

<!--
    Stump-based 24x24 discrete(?) adaboost frontal face detector.
    Created by Rainer Lienhart.

////////////////////////////////////////////////////////////////////////////////////////

  IMPORTANT: READ BEFORE DOWNLOADING, COPYING, INSTALLING OR USING.

  By downloading, copying, installing or using the software you agree to this license.
  If you do not agree to this license, do not download, install,
  copy or use the software.


                        Intel License Agreement
                For Open Source Computer Vision Library

 Copyright (C) 2000, Intel Corporation, all rights reserved.
 Third party copyrights are property of their respective owners.

 Redistribution and use in source and binary forms, with or without modification,
 are permitted provided that the following conditions are met:

   * Redistribution's of source code must retain the above copyright notice,
     this list of conditions and the following disclaimer.

   * Redistribution's in binary form must reproduce the above copyright notice,
     this list of conditions and the following disclaimer in the documentation
     and/or other materials provided with the distribution.

   * The name of Intel Corporation may not be used to endorse or promote products
     derived from this software without specific prior written permission.

 This software is provided by the copyright holders and contributors "as is" and
 any express or implied warranties, including, but not limited to, the implied
 warranties of merchantability and fitness for a particular purpose are disclaimed.
 In no event shall the Intel Corporation or contributors be liable for any direct,
 indirect, incidental, special, exemplary, or consequential damages
 (including, but not limited to, procurement of substitute goods or services;
 loss of use, data, or profits; or business interruption) however caused
 and on any theory of liability, whether in contract, strict liability,
 or tort (including negligence or otherwise) arising in any way out of
 the use of this software, even if advised of the possibility of such damage.
-->
