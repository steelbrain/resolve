'use strict'

/* @flow */

import Path from 'path'
import * as Helpers from './helpers'
import { resolveOnFileSystem } from './resolver'
import type { Resolve$Config, Resolve$Config$User } from './types'

async function getDirectory(request: string, config: Resolve$Config): Promise {
  const chunks = Helpers.getChunks(request)
  if (!chunks.length) {
    throw Helpers.getError(request)
  }
  let moduleName = chunks.shift()
  if (config.alias[moduleName]) {
    moduleName = config.alias[moduleName]
  }

  for (const root of config.root) {
    for (const moduleDirectory of config.moduleDirectories) {
      try {
        const directoryPath = Path.isAbsolute(moduleDirectory) ?
          Path.join(moduleDirectory, moduleName) :
          Path.join(root, moduleDirectory, moduleName)
        await config.fs.stat(directoryPath)
        return [directoryPath].concat(chunks).join(Path.sep)
      } catch (_) { /* No-Op */ }
    }
  }
  throw Helpers.getError(request)
}

async function resolve(request: string, requestDirectory: string, givenConfig: Resolve$Config$User = {}): Promise {
  const config = Helpers.fillConfig(givenConfig)
  if (config.alias[request]) {
    request = config.alias[request]
  }
  if (Helpers.isCore(request)) {
    return request
  }
  if (request.substr(0, 1) === '/') {
    return resolveOnFileSystem(request, request, config)
  }
  if (Helpers.isLocal(request)) {
    return resolveOnFileSystem(request, Path.resolve(requestDirectory, request), config)
  }
  return resolveOnFileSystem(request, await getDirectory(request, config), config)
}

module.exports = resolve
module.exports.isLocal = Helpers.isLocal
module.exports.isCore = Helpers.isCore
