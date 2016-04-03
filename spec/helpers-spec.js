'use babel'

import * as Helpers from '../lib/helpers'

describe('Helpers', function() {
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
})
