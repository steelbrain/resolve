'use strict'

/* @flow */

import Path from 'path'
import * as Helpers from './helpers'
import { resolve as resolveOnFS } from './resolver'
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
        return { requestPath: [directoryPath].concat(chunks).join(Path.sep), directoryPath }
      } catch (_) { /* No-Op */ }
    }
  }
  throw Helpers.getError(request)
}

async function resolve(request: string, requestDirectory: string, givenConfig: Resolve$Config$User = {}): Promise<string> {
  const config = Helpers.fillConfig(givenConfig)
  if (typeof config.alias[request] === 'string') {
    request = config.alias[request]
  }
  if (Helpers.isCore(request)) {
    return request
  }
  if (Path.isAbsolute(request)) {
    return resolveOnFS(config, request, request)
  }
  if (Helpers.isLocal(request)) {
    return resolveOnFS(config, request, Path.resolve(requestDirectory, request))
  }
  const { requestPath, directoryPath } = await getDirectory(request, config)
  return resolveOnFS(config, request, requestPath, Path.dirname(directoryPath))
}

module.exports = resolve
module.exports.isLocal = Helpers.isLocal
module.exports.isCore = Helpers.isCore
