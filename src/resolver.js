'use strict'

/* @flow */

import Path from 'path'
import { getError } from './helpers'
import type { Resolve$Config } from './types'

export async function resolveOnFileSystem(
  originalRequest: string,
  request: string,
  config: Resolve$Config
): Promise<string> {
  let stats
  try {
    stats = await config.fs.stat(request)
  } catch (_) { /* No-Op */ }
  if (stats) {
    if (stats.isFile()) {
      return request
    }
    if (!stats.isDirectory()) {
      throw getError(originalRequest)
    }
    let manifestContents
    try {
      const manifestPath = Path.join(request, 'package.json')
      manifestContents = JSON.parse(await config.fs.readFile(manifestPath))
    } catch (_) { /* No-Op */ }
    if (manifestContents) {
      for (const entry of config.packageMains) {
        let value = manifestContents[entry]
        if (typeof value === 'string') {
          if (value === '.' || value === './') {
            value = './index'
          }
          try {
            return await resolveOnFileSystem(originalRequest, Path.resolve(request, value), config)
          } catch (_) { /* No-Op */ }
        }
      }
    }
    return await resolveOnFileSystem(originalRequest, Path.resolve(request, './index'), config)
  }

  for (const entry of config.extensions) {
    const filePath = request + entry
    try {
      await config.fs.stat(filePath)
      return filePath
    } catch (_) { /* No-Op */ }
  }
  throw getError(originalRequest)
}
