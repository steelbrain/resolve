'use babel'

import Path from 'path'
import { it } from './helpers'
import * as Helpers from '../lib/helpers'

describe('Helpers', function() {
  const defaultConfig = Helpers.fillConfig({})

  describe('fillConfig', function() {
    it('fills empty config', function() {
      const config = Helpers.fillConfig({})
      expect(Array.isArray(config.root)).toBe(true)
      expect(config.root).toEqual([process.cwd()])
      expect(config.alias).toEqual({})
      expect(Array.isArray(config.extensions)).toBe(true)
      expect(Array.isArray(config.packageMains)).toBe(true)
      expect(typeof config.fs).toBe('object')
      expect(typeof config.fs.stat).toBe('function')
      expect(typeof config.fs.readFile).toBe('function')
    })
    it('merges fs', function() {
      const readFile = function() {}
      const config = Helpers.fillConfig({ fs: { readFile } })
      expect(typeof config.fs).toBe('object')
      expect(typeof config.fs.stat).toBe('function')
      expect(config.fs.readFile).toBe(readFile)
    })
  })

  describe('isLocal', function() {
    it('returns true for local stuff', function() {
      expect(Helpers.isLocal('./test')).toBe(true)
      expect(Helpers.isLocal('./test/test')).toBe(true)
      expect(Helpers.isLocal('../test/test')).toBe(true)
      expect(Helpers.isLocal('..')).toBe(true)
      expect(Helpers.isLocal('.')).toBe(true)
    })
    it('returns false for non-local stuff', function() {
      expect(Helpers.isLocal('motion-fs/.')).toBe(false)
      expect(Helpers.isLocal('motion-fs/package.json')).toBe(false)
      expect(Helpers.isLocal('motion-fs/../package.json')).toBe(false)
    })
  })

  describe('isCore', function() {
    it('returns true for local stuff', function() {
      expect(Helpers.isCore('fs')).toBe(true)
      expect(Helpers.isCore('https')).toBe(true)
      expect(Helpers.isCore('http')).toBe(true)
      expect(Helpers.isCore('events')).toBe(true)
    })
    it('returns false for non-local stuff', function() {
      expect(Helpers.isCore('babel')).toBe(false)
      expect(Helpers.isCore('babel-preset-steelbrain')).toBe(false)
      expect(Helpers.isCore('eslint-config-steelbrain')).toBe(false)
    })
  })

  describe('getChunks', function() {
    it('returns chunks properly', function() {
      expect(Helpers.getChunks('node/test')).toEqual(['node', 'test'])
      expect(Helpers.getChunks('node')).toEqual(['node'])
      expect(Helpers.getChunks('babel/package.json')).toEqual(['babel', 'package.json'])
    })
  })

  describe('getError', function() {
    it('returns a proper error', function() {
      const error = Helpers.getError('test')
      expect(error.code).toBe('MODULE_NOT_FOUND')
      expect(error.message).toBe("Cannot find module 'test'")
    })
  })

  describe('resolveOnFileSystem', function() {
    it('rejects with a proper error', async function() {
      try {
        await Helpers.resolveOnFileSystem('test', __dirname, defaultConfig)
        expect(false).toBe(true)
      } catch (_) {
        expect(_.code).toBe('MODULE_NOT_FOUND')
        expect(_.message).toBe("Cannot find module 'test'")
      }
    })
    it('resolves direct files properly', async function() {
      expect(await Helpers.resolveOnFileSystem('x', __filename, defaultConfig)).toBe(__filename)
    })
    it('resolves modules with manifests properly', async function() {
      const mainFile = Path.normalize(Path.join(__dirname, '..', 'lib', 'index.js'))
      expect(await Helpers.resolveOnFileSystem('x', Path.dirname(__dirname), defaultConfig)).toBe(mainFile)
    })
    it('resolves modules with . or ./ in main properely', async function() {
      const specDir = Path.join(__dirname, 'fixtures', 'dot-in-main')
      expect(await Helpers.resolveOnFileSystem('x', specDir, defaultConfig)).toBe(
        Path.join(specDir, 'index.js')
      )
    })
    it('resolves modules without manifests', async function() {
      const specDir = Path.join(__dirname, 'fixtures', 'no-manifest')
      expect(await Helpers.resolveOnFileSystem('x', specDir, defaultConfig)).toBe(
        Path.join(specDir, 'index.json')
      )
    })
  })
})
