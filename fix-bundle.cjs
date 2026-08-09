const { readFileSync, writeFileSync, existsSync } = require('fs')
const { resolve } = require('path')

const bundlePath = resolve(__dirname, 'out/main/index.js')

if (!existsSync(bundlePath)) {
  console.log('Bundle not found yet, skipping patch')
  process.exit(0)
}

let code = readFileSync(bundlePath, 'utf8')

const before = `function commonjsRequire(path) {
  throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}`

const after = `function commonjsRequire(path) {
  return require(path);
}`

if (!code.includes('function commonjsRequire')) {
  console.log('No commonjsRequire found — bundle already clean')
  process.exit(0)
}

code = code.replace(before, after)
writeFileSync(bundlePath, code, 'utf8')
console.log('Bundle patched: commonjsRequire → require')
