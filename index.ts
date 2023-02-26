import UmdImporter from './src/main'

const umdImporter = new UmdImporter({debug: true})

const [React, ReactDOM] = await Promise.all([
  umdImporter.import<any>('https://unpkg.com/react@18/umd/react.development.js'),
  umdImporter.import<any>('https://unpkg.com/react-dom@18/umd/react-dom.development.js'),
])

ReactDOM.createRoot(document.getElementById('app')).render(React.createElement('div', null, 'loaded'))
