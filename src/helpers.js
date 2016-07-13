/* @flow */

import FS from 'fs'
import Path from 'path'
// $FlowIgnore: Stupid ignore doesn't recognize it
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
  let extensions
  if (config.extensions && (Array.isArray(config.extensions) || config.extensions.constructor.name === 'Set')) {
    extensions = config.extensions
  } else {
    extensions = ['.js', '.json']
  }
  filled.extensions = new Set(extensions)
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

export function statItem(request: string, config: Config): Promise<FS.Stats> {
  return config.fs.stat(request).catch(function() {
    return null
  })
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

export function getError(request: string, parent: string, config: Config): Error {
  const error = new Error(`Cannot find module '${request}'`)
  // $FlowIgnore: This is our custom property
  error.code = 'MODULE_NOT_FOUND'
  // $FlowIgnore: This is our custom property
  error.items_searched = config.items_searched
  error.stack = `${error.message}\n    at ${parent}:0:0`
  return error
}

export function getPackageRoot(request: string, config: Config): ?string {
  const chunks = request.split(Path.sep)
  let i = chunks.length
  while (--i) {
    const currentChunk = chunks[i]
    if (config.moduleDirectories.indexOf(currentChunk) !== -1) {
      break
    }
  }
  if (i === 0) {
    return null
  }
  return chunks.slice(0, i + 2).join(Path.sep)
}
