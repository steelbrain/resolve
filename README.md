# Resolve

`sb-resolve` is a node module that supports `require.resolve`'s lookup algorithm but with advance configurations.

## Installation

```
npm install --save sb-resolve
```

## API

```js
type $Options = {
  fs?: {
    stat?: ((filePath: string) => Promise<FS.Stats>),
    readFile?: ((filePath: string) => Promise<string>)
  },
  root?: string | Array<string>,
  alias?: Object, // Example: {react: 'preact-compat'}
  extensions?: Array<string>,
  packageMains?: Array<string>,
  moduleDirectories?: Array<string>
} = {
  fs: {
    stat: promisify(FS.stat),
    readFile: promisify(FS.readFile),
  },
  root: [path.resolve('./')],
  alias: {},
  extensions: ['.js', '.json'],
  packageMains: ['browser', 'main'],
  moduleDirectories: ['node_modules']
}

function isLocal(request: string): boolean
function isCore(request: string): boolean
function resolve(request: string, requestDirectory: string, options: $Options): Promise<string>

export { isLocal, isCore }
export default resolve
```

## Examples

```js
import resolve, { isCore } from 'sb-resolve'

console.log(isCore('fs')) // true
console.log(isCore('babel')) // false

resolve('babel', __dirname).then(function(mainFile) {
  console.log(mainFile) // /tmp/test/node_modules/babel/index.js
})
```

## Notes

To give developers full control over the resolution, this module does not keep looking for `moduleDirectories` upwards, to add those directories, you must manually add those `node_modules` directories' absolute paths to `moduleDirectories` or add their parent folders in `root`

## License
This project is licensed under the terms of MIT License. See the LICENSE file for more info.
