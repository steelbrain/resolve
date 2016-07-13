/* @flow */

import FS from 'fs'
import Path from 'path'
import promisify from 'sb-promisify'
import type { Config } from './types'

const fsStat = promisify(FS.stat)
const fsReadFile = promisify(FS.readFile)
const coreModules = require('../vendor/core.json')

const REGEX_LOCAL = /^\.[\\\/]?/
const REGEX_DIR_SEPARATOR = /\/|\\/
const CORE_MODULES = new Set(coreModules)

export function fillConfig(config: Object): Config {
  const filled = {}
  if (Array.isArray(config.extensions)) {
    filled.extensions = config.extensions.slice()
  } else {
    filled.extensions = ['.js', '.json']
  }
  if (Array.isArray(config.packageMains)) {
    filled.packageMains = config.packageMains
  } else {
    filled.packageMains = ['main']
  }
  if (Array.isArray(config.moduleDirectories)) {
    filled.moduleDirectories = config.moduleDirectories
  } else {
    filled.moduleDirectories = ['node_modules']
  }
  if (typeof config.process === 'function') {
    filled.process = config.process
  } else {
    filled.process = manifest => manifest.main || './index'
  }
  if (typeof config.root === 'string') {
    filled.root = Path.normalize(config.root)
  } else {
    filled.root = null
  }
  if (config.fs && typeof config.fs === 'object') {
    filled.fs = {
      stat: config.fs.stat && typeof config.fs.stat === 'function' ? config.fs.stat : fsStat,
      readFile: config.fs.readFile && typeof config.fs.readFile === 'function' ? config.fs.readFile : fsReadFile,
    }
  } else {
    filled.fs = {
      stat: fsStat,
      readFile: fsReadFile,
    }
  }
  filled.items_searched = []

  return filled
}

export function isPathLocal(request: string): boolean {
  return REGEX_LOCAL.test(request)
}

export function isPathCore(request: string): boolean {
  return CORE_MODULES.has(request)
}

export function getChunksOfPath(request: string): Array<string> {
  return request.split(REGEX_DIR_SEPARATOR)
}

export function getError(request: string, parent: string): Error {
  const error = new Error(`Cannot find module '${request}'`)
  // $FlowIgnore: This is our custom property
  error.code = 'MODULE_NOT_FOUND'
  error.stack = `${error.message}\n    at ${parent}:0:0`
  return error
}
