import UmdImporter from './src/main'

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
