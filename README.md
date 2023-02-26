# umd-importer
An importer loading javascript umd package from http link.

[![https://nodei.co/npm/@boogoo/umd-importer.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/@boogoo/umd-importer.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/@boogoo/umd-importer)

## How to use
Import umd package js file from http link.

Just like normal es module.

First install package to your project:
```shell
npm i @boogoo/umd-importer
# or
yarn add @boogoo/umd-importer
```

Then use it in your code:
```javascript
import UmdImporter from '@boogoo/umd-importer'

const umdImporter = new UmdImporter({
  // If debug mode is open, UmdImporter will log more info about url and cache.
  // Under debug mode, package js file will be followed by //# sourceURL=[module], so you can debug package by devtools.
  debug: true,

  // If cache is true, UmdImporter will cache succeed resource by package name.
  cache: true,
})

const [_, React, ReactDOM] = await Promise.all([
  // Fetch link firt time, it will be cached.
  umdImporter.import<any>('https://unpkg.com/react@18.2.0/umd/react.development.js'),
  // Will not fetch again. It will be returned from cache.
  umdImporter.import<any>('https://unpkg.com/react@18.2.0/umd/react.development.js'),
  umdImporter.import<any>('https://unpkg.com/react-dom@18.2.0/umd/react-dom.development.js'),
])

ReactDOM
  .createRoot(document.getElementById('app'))
  .render(React.createElement('div', null, 'loaded'))

try {
  // Link will be 404, it will not be cached.
  await umdImporter.import<any>('https://unpkg.com/404@1.1.1/index.js')
} catch (e) {}

// The same package fetched failed last time. It will be fetched again.
await umdImporter.import<any>('https://unpkg.com/404@1.1.1/index.js')
```
