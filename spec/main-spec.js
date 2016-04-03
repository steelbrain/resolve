'use babel'

import Path from 'path'
import { it } from './helpers'
import resolve from '../'

describe('resolve', function() {
  const modulesRoot = Path.dirname(__dirname)

  it('supports aliases for top-level stuff', async function() {
    expect(await resolve('fs', modulesRoot, { alias: { fs: 'http' } })).toBe('http')
  })
  it('supports aliases for deep stuff', async function() {
    const babelCorePath = await resolve('babel-core/package.json', __dirname, { root: modulesRoot })
    expect(await resolve('some-weird-dep/package.json', __dirname, {
      alias: {
        'some-weird-dep': 'babel-core'
      },
      root: modulesRoot
    })).toBe(babelCorePath)
  })
  it('supports custom moduleDirectories', async function() {
    const specDir = Path.join(__dirname, 'fixtures', 'custom-module-dir')
    expect(await resolve('cool_module', __dirname, {
      root: specDir,
      moduleDirectories: ['cool_modules']
    })).toBe(Path.join(specDir, 'cool_modules', 'cool_module', 'index.json'))
  })
  it('supports deep requires', async function() {
    const specDir = Path.join(__dirname, 'fixtures', 'custom-module-dir')
    expect(await resolve('cool_module/package', __dirname, {
      root: specDir,
      moduleDirectories: ['cool_modules']
    })).toBe(Path.join(specDir, 'cool_modules', 'cool_module', 'package.json'))
  })
})
