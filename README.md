# umd-importer
An importer loading javascript umd package from http link.

[![https://nodei.co/npm/@boogoo/umd-importer.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/@boogoo/umd-importer.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/@boogoo/umd-importer)

Online demo: [codesandbox](https://codesandbox.io/p/sandbox/boogoo-umd-importer-uv9lei?file=%2Fsrc%2Fmain.tsx&selection=%5B%7B%22endColumn%22%3A46%2C%22endLineNumber%22%3A1%2C%22startColumn%22%3A26%2C%22startLineNumber%22%3A1%7D%5D)

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

    // If external is set, importer will search external dependences first.
    // This option helps you inject external packages into your module where called require('some-pkg').
    external: {
      // Dayjs is an antd dependence.
      dayjs: (window as any).dayjs,
  },
  })

const [_, React, ReactDOM, Antd] = await Promise.all([
  // Fetch link first time, it will be cached.
  umdImporter.import<any>('https://unpkg.com/react@18.2.0/umd/react.development.js'),

  // Will not fetch again. It will be returned from cache.
  umdImporter.import<any>('https://unpkg.com/react@18.2.0/umd/react.development.js'),

  // React-dom requires react.
  // Since you have import react first, importer will load react automatic.
  umdImporter.import<any>('https://unpkg.com/react-dom@18.2.0/umd/react-dom.development.js'),

  // You should specify packageName. eg. umdImporter.import(url, packageName)
  // Otherwise, importer will auto generate a packageName by url.
  // If the link is https://a.b.c/pkg.js, auto generated name will be pkg.
  // If the link is https://a.b.c/pkg/index.js, you MUST specify a packageName. Otherwise, other link end with index.js will not be loaded.
  umdImporter.import<any>('https://cdnjs.cloudflare.com/ajax/libs/antd/5.2.2/antd.min.js', 'antd'),
])

ReactDOM
  .createRoot(document.getElementById('app'))
  .render(React.createElement(Antd.Result, null))

try {
  // Link will be 404, it will not be cached.
  await umdImporter.import<any>('https://unpkg.com/404@1.1.1/index.js')
} catch (e) {
  // The same package fetched failed last time. It will be fetched again.
  await umdImporter.import<any>('https://unpkg.com/404@1.1.1/index.js')
}
```
