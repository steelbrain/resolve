'use strict'

/* @flow */

import Path from 'path'
import FS from 'fs'
import promisify from 'sb-promisify'
import type { Resolve$Config } from './types'

const fsStat = promisify(FS.stat)
const fsReadFile = promisify(FS.readFile)
const REGEX_LOCAL = /^\.[\\\/]?/
const REGEX_DEEP = /[\/\\]/
const REGEX_DIR_SEPARATOR = /\/|\\/
const CORE_MODULES = new Set(require('../vendor/core.json'))

export function fillConfig(config: Object): Resolve$Config {
  const filled = {}
  if (Array.isArray(config.extensions)) {
    filled.extensions = config.extensions.slice()
  } else {
    filled.extensions = ['.js', '.json']
  }
  if (Array.isArray(config.packageMains)) {
    filled.packageMains = config.packageMains
  } else {
    filled.packageMains = ['browser', 'main']
  }
  if (Array.isArray(config.moduleDirectories)) {
    filled.moduleDirectories = config.moduleDirectories
  } else {
    filled.moduleDirectories = ['node_modules']
  }
  if (config.fs && typeof config.fs === 'object') {
    filled.fs = {
      stat: config.fs.stat && typeof config.fs.stat === 'function' ? config.fs.stat : fsStat,
      readFile: config.fs.readFile && typeof config.fs.readFile === 'function' ? config.fs.readFile : fsReadFile
    }
  } else {
    filled.fs = {
      stat: fsStat,
      readFile: fsReadFile
    }
  }

  return filled
}

export async function stat(config: Resolve$Config, path: string): Promise<?FS.Stats> {
  try {
    return await config.fs.stat(path)
  } catch (_) {
    return null
  }
}

export function exists(config: Resolve$Config, path: string): Promise<boolean> {
  return stat(config, path).then(function(result) {
    return result !== null
  })
}

export function isLocal(request: string): boolean {
  return REGEX_LOCAL.test(request)
}

export function isCore(request: string): boolean {
  return CORE_MODULES.has(request)
}

export function getChunks(request: string): Array<string> {
  return request.split(REGEX_DEEP)
}

export function getError(request: string): Error {
  const error = new Error(`Cannot find module '${request}'`)
  // $FlowIgnore: This is our custom property
  error.code = 'MODULE_NOT_FOUND'
  return error
}
