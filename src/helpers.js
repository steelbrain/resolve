'use strict'

/* @flow */

import FS from 'fs'
import promisify from 'sb-promisify'
import type { Resolve$Config } from './types'

const fsStat = promisify(FS.stat)
const fsReadFile = promisify(FS.readFile)

export function fillConfig(config: Object): Resolve$Config {
  const filled = {}
  if (typeof config.root === 'string') {
    filled.root = [config.root]
  } else if (Array.isArray(config.root)) {
    filled.root = config.root
  }
  if (config.alias && typeof config.alias === 'object') {
    filled.alias = config.alias
  } else {
    filled.alias = {}
  }
  if (Array.isArray(config.extensions)) {
    filled.extensions = config.extensions
  } else {
    filled.extensions = []
  }
  if (Array.isArray(config.packageMains)) {
    filled.packageMains = config.packageMains
  } else {
    filled.packageMains = []
  }
  if (Array.isArray(config.moduleDirectories)) {
    filled.moduleDirectories = config.moduleDirectories
  } else {
    filled.moduleDirectories = []
  }
  if (config.fs && typeof config.fs === 'object') {
    filled.fs = {
      stat: config.fs.stat && typeof config.fs.stat === 'object' ? config.fs.stat : fsStat,
      readFile: config.fs.readFile && typeof config.fs.readFile === 'object' ? config.fs.readFile : fsReadFile
    }
  } else {
    filled.fs = {
      stat: fsStat,
      readFile: fsReadFile
    }
  }
  return filled
}
