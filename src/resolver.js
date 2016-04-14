'use strict'

/* @flow */

import Path from 'path'
import { exists, stat, find, getError } from './helpers'
import type { Resolve$Config } from './types'

const EMPTY_MODULE = require.resolve('./_empty.js')

function isComplicatedLocal(config: Resolve$Config, request: string, moduleRoot: string): boolean {
  const chunks = request.split(Path.sep)
  let i = chunks.length
  while (i--) {
    const currentChunk = chunks[i]
    if (config.moduleDirectories.indexOf(currentChunk) !== -1) {
      break
    }
  }
  const joined = chunks.slice(0, i).join(Path.sep)
  return joined === moduleRoot
}

export async function resolve(config: Resolve$Config, displayName: string, request: string, moduleRoot: ?string = null): Promise<string> {
  if (!moduleRoot) {
    moduleRoot = await find(config, Path.dirname(request), ['package.json'].concat(config.moduleDirectories))
    if (moduleRoot) {
      moduleRoot = Path.dirname(moduleRoot)
    }
  }
  if (moduleRoot) {
    let parentManifestContents
    const parentManifestPath = Path.join(moduleRoot, 'package.json')
    if (await exists(config, parentManifestPath)) {
      try {
        parentManifestContents = JSON.parse(await config.fs.readFile(parentManifestPath))
      } catch (_) {
        throw new Error(`Error reading manifest file at ${parentManifestPath}`)
      }
    }
    if (parentManifestContents) {
      if (isComplicatedLocal(config, request, moduleRoot)) {
        const relativePath = './' +  Path.relative(moduleRoot, request)
        const extensions = config.extensions
        let found = false
        for (const extension of extensions) {
          for (const entry of config.packageMains) {
            const value = parentManifestContents[entry]
            const key = relativePath + extension
            if (typeof value === 'object') {
              if (value[key] === false) {
                return EMPTY_MODULE
              }
              if (typeof value[key] === 'string') {
                request = value[key]
                found = true
                break
              }
            }
          }
          if (found) {
            break
          }
        }
        if (found) {
          request = Path.join(moduleRoot, request)
        }
      } else {
        for (const entry of config.packageMains) {
          const value = parentManifestContents[entry]
          if (typeof value === 'object') {
            if (value[request] === false) {
              return EMPTY_MODULE
            }
            if (typeof value[request] === 'string') {
              request = value[request]
              break
            }
          }
        }
      }
    }
  }

  const fileStat = await stat(config, request)
  if (fileStat && fileStat.isFile()) {
    return request
  }
  if (fileStat && fileStat.isDirectory()) {
    return await resolveAsDirectory(config, displayName, request)
  }

  return await resolveAsFile(config, displayName, request)
}

export async function resolveAsFile(config: Resolve$Config, displayName: string, request: string): Promise<string> {
  for (const entry of config.extensions) {
    const filePath = request + entry
    try {
      await config.fs.stat(filePath)
      return filePath
    } catch (_) { /* No-Op */ }
  }

  throw getError(displayName)
}

export async function resolveAsDirectory(config: Resolve$Config, displayName: string, request: string): Promise<string> {
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
          return await resolve(config, displayName, Path.resolve(request, value))
        } catch (_) { /* No-Op */ }
      }
    }
  }
  return await resolve(config, displayName, Path.resolve(request, './index'))
}
