'use babel'

import { it } from 'jasmine-fix'
import * as Helpers from '../lib/helpers'

describe('Helpers', function() {
  const defaultConfig = Helpers.fillConfig({})

  describe('fillConfig', function() {
    it('fills empty config', function() {
      const config = Helpers.fillConfig({})
      expect(config.root).toBe(null)
      expect(config.extensions && config.extensions.constructor.name).toBe('Set')
      expect(Array.isArray(config.packageMains)).toBe(true)
      expect(Array.isArray(config.moduleDirectories)).toBe(true)
      expect(typeof config.process).toBe('function')
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

  describe('isPathLocal', function() {
    it('returns true for local stuff', function() {
      expect(Helpers.isPathLocal('./test')).toBe(true)
      expect(Helpers.isPathLocal('./test/test')).toBe(true)
      expect(Helpers.isPathLocal('../test/test')).toBe(true)
      expect(Helpers.isPathLocal('..')).toBe(true)
      expect(Helpers.isPathLocal('.')).toBe(true)
    })
    it('returns false for non-local stuff', function() {
      expect(Helpers.isPathLocal('motion-fs/.')).toBe(false)
      expect(Helpers.isPathLocal('motion-fs/package.json')).toBe(false)
      expect(Helpers.isPathLocal('motion-fs/../package.json')).toBe(false)
    })
  })

  describe('isPathCore', function() {
    it('returns true for local stuff', function() {
      expect(Helpers.isPathCore('fs')).toBe(true)
      expect(Helpers.isPathCore('https')).toBe(true)
      expect(Helpers.isPathCore('http')).toBe(true)
      expect(Helpers.isPathCore('events')).toBe(true)
    })
    it('returns false for non-local stuff', function() {
      expect(Helpers.isPathCore('babel')).toBe(false)
      expect(Helpers.isPathCore('babel-preset-steelbrain')).toBe(false)
      expect(Helpers.isPathCore('eslint-config-steelbrain')).toBe(false)
    })
  })

  describe('getChunksOfPath', function() {
    it('returns chunks properly', function() {
      expect(Helpers.getChunksOfPath('node/test')).toEqual(['node', 'test'])
      expect(Helpers.getChunksOfPath('node')).toEqual(['node'])
      expect(Helpers.getChunksOfPath('babel/package.json')).toEqual(['babel', 'package.json'])
    })
  })

  describe('getError', function() {
    it('returns a proper error', function() {
      const error = Helpers.getError('test', 'parent', { items_searched: [] })
      expect(error.code).toBe('MODULE_NOT_FOUND')
      expect(error.message).toBe("Cannot find module 'test'")
    })
  })

  describe('getPackageRoot', function() {
    it('returns null or string when the module is a local', function() {
      expect(Helpers.getPackageRoot('/var/www/lib', defaultConfig)).toBe(null)
      expect(Helpers.getPackageRoot('/var/www/lib/asd', defaultConfig)).toBe(null)
      expect(Helpers.getPackageRoot('/var/www/lib/asd/asd', defaultConfig)).toBe(null)
      expect(Helpers.getPackageRoot('/var/node_modules/asd/lib', defaultConfig)).toBe('/var/node_modules/asd')
      expect(Helpers.getPackageRoot('/var/node_modules/asd/lib/bin', defaultConfig)).toBe('/var/node_modules/asd')
    })
  })
})
