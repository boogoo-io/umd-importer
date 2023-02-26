# umd-importer
An importer loading online umd package javascript file.

## How to use
Import umd package by http js file.

Just like normal esmodule.
```javascript
import UmdImporter from "./src/main"

const umdImporter = new UmdImporter({debug: true})

const [React, ReactDOM] = await Promise.all([
  umdImporter.import<any>('https://unpkg.com/react@18/umd/react.development.js'),
  umdImporter.import<any>('https://unpkg.com/react-dom@18/umd/react-dom.development.js'),
])

ReactDOM.createRoot(document.getElementById('app')).render(React.createElement('div', null, 'load
```
