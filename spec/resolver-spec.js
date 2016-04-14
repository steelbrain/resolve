'use babel'

import Path from 'path'
import { it } from './helpers'
import * as Helpers from '../lib/helpers'
import * as Resolver from '../lib/resolver'

describe('Resolver', function() {
  const defaultConfig = Helpers.fillConfig({})

  describe('resolve', function() {
    it('rejects with a proper error', async function() {
      try {
        await Resolver.resolve(defaultConfig, 'test', 'test', __dirname)
        expect(false).toBe(true)
      } catch (_) {
        expect(_.code).toBe('MODULE_NOT_FOUND')
        expect(_.message).toBe("Cannot find module 'test'")
      }
    })
    it('resolves direct files properly', async function() {
      expect(await Resolver.resolve(defaultConfig, 'x', __filename)).toBe(__filename)
    })
    it('resolves modules with manifests properly', async function() {
      const mainFile = Path.normalize(Path.join(__dirname, '..', 'lib', 'index.js'))
      expect(await Resolver.resolve(defaultConfig, 'x', Path.dirname(__dirname))).toBe(mainFile)
    })
    it('resolves modules with . or ./ in main properely', async function() {
      const specDir = Path.join(__dirname, 'fixtures', 'dot-in-main')
      expect(await Resolver.resolve(defaultConfig, 'x', specDir)).toBe(
        Path.join(specDir, 'index.js')
      )
    })
    it('resolves modules without manifests', async function() {
      const specDir = Path.join(__dirname, 'fixtures', 'no-manifest')
      expect(await Resolver.resolve(defaultConfig, 'x', specDir)).toBe(
        Path.join(specDir, 'index.json')
      )
    })
    it('resolves local references properly', async function() {
      expect(await Resolver.resolve(defaultConfig, './helpers', Path.join(__dirname, './helpers'))).toBe(require.resolve('./helpers'))
    })
    it('resolves modules with manifests but no mains', async function() {
      const specDir = Path.join(__dirname, 'fixtures', 'manifest-no-main')
      expect(await Resolver.resolve(defaultConfig, 'x', specDir)).toBe(
        Path.join(specDir, 'index.json')
      )
    })
    it('supports browser fields properly', async function() {
      const specDir = Path.join(__dirname, 'fixtures', 'browser-alias')
      expect(await Resolver.resolve(defaultConfig, 'x', specDir)).toBe(
        Path.join(specDir, 'browser-main.js')
      )
    })
    it('supports ignoring based on browser field', async function() {
      const specDir = Path.join(__dirname, 'fixtures', 'browser-ignore')
      expect(await Resolver.resolve(defaultConfig, 'x', specDir)).toBe(
        require.resolve('../lib/_empty.js')
      )
    })
    it('supports applying these rules on a deep dependency', async function() {
      const specDir = Path.join(__dirname, 'fixtures', 'browser-deep')
      expect(await Resolver.resolve(defaultConfig, 'test', 'test', specDir)).toBe(
        require.resolve('../lib/_empty.js')
      )
    })
  })
})
