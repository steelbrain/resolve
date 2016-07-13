/* @flow */

import Path from 'path'
import invariant from 'assert'
import { capture as captureStack } from 'sb-callsite'
import { fillConfig, isCore, isLocal, statItem, getError, getChunks, getLocalPackageRoot } from './helpers'
import type { Config } from './types'

async function resolveAsFile(request: string, config: Config): Promise<?string> {
  // Check existence by adding extensions
  if (config.extensions.indexOf(Path.extname(request)) !== -1 && await statItem(request, config)) {
    return request
  }
  for (const extension of config.extensions) {
    const newPath = request + extension
    if (await statItem(newPath, config)) {
      return newPath
    }
  }
  return null
}

async function resolveAsDirectory(request: string, parent: string, config: Config, givenRequest: string): Promise<string> {
  let manifest = {}
  try {
    manifest = JSON.parse(await config.fs.readFile(Path.join(request, 'package.json')))
  } catch (_) { /* No Op */ }
  let givenMainFile = config.process(manifest, request)
  givenMainFile = Path.normalize(givenMainFile) + (givenMainFile.substr(0, 1) === '/' ? '/' : '')
  if (givenMainFile === '.' || givenMainFile === '.\\' || givenMainFile === './') {
    givenMainFile = './index'
  }
  const mainFile = Path.isAbsolute(givenMainFile) ? givenMainFile : Path.resolve(request, givenMainFile)
  const stat = await statItem(mainFile, config)
  // $/ should be treated as a dir first
  if (stat && givenMainFile.substr(-1) === '/') {
    // Disallow requiring a file as a directory
    if (!stat.isDirectory()) {
      throw getError(givenRequest, parent, config)
    }
    return await resolveAsDirectory(mainFile, parent, config, givenRequest)
  }
  // Use the request if it's a file and has a valid known extension
  if (stat && stat.isFile() && config.extensions.indexOf(Path.extname(request)) !== -1) {
    return mainFile
  }
  const resolvedAsFile = await resolveAsFile(mainFile, config)
  if (resolvedAsFile) {
    return resolvedAsFile
  }
  if (stat) {
    return await resolveAsDirectory(mainFile, parent, config, givenRequest)
  }
  throw getError(givenRequest, parent, config)
}

async function resolveModulePath(request: string, parent: string, config: Config): Promise<string> {
  const chunks = getChunks(request)
  const moduleName = chunks.shift()
  const packageRoots = new Set()

  const localRoot = getLocalPackageRoot(Path.dirname(parent), config)
  if (localRoot) {
    packageRoots.add(localRoot)
  }
  if (typeof config.root === 'string') {
    packageRoots.add(config.root)
  }

  const absoluteModuleDirectories = config.moduleDirectories.filter(i => Path.isAbsolute(i))
  const relativeModuleDirectories = config.moduleDirectories.filter(i => !Path.isAbsolute(i))

  for (const moduleDirectory of absoluteModuleDirectories) {
    const path = Path.join(moduleDirectory, moduleName)
    if (await statItem(path, config)) {
      return Path.join(path, chunks.join(''))
    }
  }
  for (const root of packageRoots) {
    for (const moduleDirectory of relativeModuleDirectories) {
      const path = Path.join(root, moduleDirectory, moduleName)
      if (await statItem(path, config)) {
        return Path.join(path, chunks.join(''))
      }
    }
  }
  throw getError(request, parent, config)
}

export async function resolve(givenRequest: string, givenParent: ?string, givenConfig: ?Config): Promise<string> {
  let parent = givenParent
  if (!parent) {
    const stack = captureStack()
    if (stack[1].file !== __filename) {
      parent = stack[1].file
    } else if (stack[2].file !== __filename) {
      parent = stack[2].file
    } else if (stack[3].file !== __filename) {
      parent = stack[3].file
    } else if (stack[4].file !== __filename) {
      parent = stack[4].file
    }
  }
  invariant(parent)
  let request = Path.normalize(givenRequest)
  const config = fillConfig(givenConfig || {})
  if (isLocal(request)) {
    // Convert ./test to $/test
    request = Path.resolve(Path.dirname(parent), request)
  } else if (!Path.isAbsolute(request)) {
    // Convert sb-promise to $/node_modules/sb-promise
    request = await resolveModulePath(request, parent, config)
  }
  const stat = await statItem(request, config)
  // $/ should be treated as a dir first
  if (stat && givenRequest.substr(-1) === '/') {
    // Disallow requiring a file as a directory
    if (!stat.isDirectory()) {
      throw getError(givenRequest, parent, config)
    }
    return await resolveAsDirectory(request, parent, config, givenRequest)
  }
  // Use the request if it's a file and has a valid known extension
  if (stat && stat.isFile() && config.extensions.indexOf(Path.extname(request)) !== -1) {
    return request
  }
  const resolved = (
    await resolveAsFile(request, config) ||
    await resolveAsDirectory(request, parent, config, givenRequest)
  )
  if (!resolved) {
    throw getError(givenRequest, parent, config)
  }
  return resolved
}

export { isCore, isLocal }
