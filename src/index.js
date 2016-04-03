'use strict'

/* @flow */

import Path from 'path'
import * as Helpers from './helpers'
import type { Resolve$Config, Resolve$Config$User } from './types'

async function getDirectory(request: string, config: Resolve$Config): Promise {
  const chunks = Helpers.getChunks(request)
  if (!chunks.length) {
    throw Helpers.getError(request)
  }
  for (const root of config.root) {
    for (const moduleDirectory of config.moduleDirectories) {
      try {
        const directoryPath = Path.join(root, moduleDirectory, request)
        await config.fs.stat(directoryPath)
        return directoryPath
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
  if (Helpers.isLocal(request)) {
    return Helpers.resolveOnFileSystem(Path.resolve(requestDirectory, request), config)
  }
  return Helpers.resolveOnFileSystem(await getDirectory(request, config), config)
}

module.exports = resolve
module.exports.isLocal = Helpers.isLocal
module.exports.isCore = Helpers.isCore
