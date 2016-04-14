'use babel'

import Path from 'path'
import { it } from './helpers'
import * as Helpers from '../lib/helpers'
import * as Resolver from '../lib/resolver'

describe('Resolver', function() {
  const defaultConfig = Helpers.fillConfig({})

  describe('resolveOnFileSystem', function() {
    it('rejects with a proper error', async function() {
      try {
        await Resolver.resolveOnFileSystem('test', __dirname, defaultConfig)
        expect(false).toBe(true)
      } catch (_) {
        expect(_.code).toBe('MODULE_NOT_FOUND')
        expect(_.message).toBe("Cannot find module 'test'")
      }
    })
    it('resolves direct files properly', async function() {
      expect(await Resolver.resolveOnFileSystem('x', __filename, defaultConfig)).toBe(__filename)
    })
    it('resolves modules with manifests properly', async function() {
      const mainFile = Path.normalize(Path.join(__dirname, '..', 'lib', 'index.js'))
      expect(await Resolver.resolveOnFileSystem('x', Path.dirname(__dirname), defaultConfig)).toBe(mainFile)
    })
    it('resolves modules with . or ./ in main properely', async function() {
      const specDir = Path.join(__dirname, 'fixtures', 'dot-in-main')
      expect(await Resolver.resolveOnFileSystem('x', specDir, defaultConfig)).toBe(
        Path.join(specDir, 'index.js')
      )
    })
    it('resolves modules without manifests', async function() {
      const specDir = Path.join(__dirname, 'fixtures', 'no-manifest')
      expect(await Resolver.resolveOnFileSystem('x', specDir, defaultConfig)).toBe(
        Path.join(specDir, 'index.json')
      )
    })
  })
})
