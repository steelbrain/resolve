/* @flow */

import Path from 'path'
import * as Helpers from './helpers'
import type { Config } from './types'

async function resolveAsFile(filePath: string, config: Config): Promise<?string> {
  if (config.extensions.has(Path.extname(filePath)) && await Helpers.statItem(filePath, config)) {
    return filePath
  }
  for (const extension of config.extensions) {
    const newPath = filePath + extension
    if (await Helpers.statItem(newPath, config)) {
      return newPath
    }
  }
  return null
}

async function resolveAsDirectory(directory: string, parent: string, config: Config): Promise<?string> {
  let manifest = {}
  try {
    manifest = JSON.parse(await config.fs.readFile(Path.join(directory, 'package.json')))
  } catch (_) { /* No Op */ }

  let mainFile = config.process(manifest, directory) || './index'
  let pathIsDirectory = mainFile.substr(-1) === '/'
  mainFile = Path.normalize(mainFile)
  if (mainFile === '.' || mainFile === '.\\' || mainFile === './') {
    mainFile = './index'
    pathIsDirectory = false
  }
  if (!Path.isAbsolute(mainFile)) {
    mainFile = Path.resolve(directory, mainFile)
  }

  const stat = await Helpers.statItem(mainFile, config)
  // $/ should be treated as a dir first
  if (pathIsDirectory) {
    // Disallow requiring a file as a directory
    return stat && stat.isDirectory() ? await resolveAsDirectory(mainFile, parent, config) : null
  }
  // Use the request if it's a file and has a valid known extension
  if (stat && stat.isFile() && config.extensions.has(Path.extname(mainFile))) {
    return mainFile
  }
  return (
    await resolveAsFile(mainFile, config) ||
    await resolveAsDirectory(mainFile, parent, config) ||
    null
  )
}

async function resolveModulePath(request: string, parent: string, config: Config): Promise<string> {
  const chunks = Helpers.getChunksOfPath(request)
  const moduleName = chunks.shift()
  const packageRoots = new Set()

  const localRoot = Helpers.getPackageRoot(Path.dirname(parent), config)
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
    if (await Helpers.statItem(path, config)) {
      return Path.join(path, chunks.join(''))
    }
  }
  for (const root of packageRoots) {
    for (const moduleDirectory of relativeModuleDirectories) {
      const path = Path.join(root, moduleDirectory, moduleName)
      if (await Helpers.statItem(path, config)) {
        return Path.join(path, chunks.join(''))
      }
    }
  }
  throw Helpers.getError(request, parent, config)
}

async function resolve(givenRequest: string, parent: string, givenConfig: ?Config): Promise<string> {
  let request = Path.normalize(givenRequest)
  const config = Helpers.fillConfig(givenConfig || {})
  if (Helpers.isPathLocal(request)) {
    // Convert ./test to $/test
    request = Path.resolve(Path.dirname(parent), request)
  } else if (!Path.isAbsolute(request)) {
    // Convert sb-promise to $/node_modules/sb-promise
    request = await resolveModulePath(request, parent, config)
  }
  const stat = await Helpers.statItem(request, config)
  // $/ should be treated as a dir first
  if (stat && givenRequest.substr(-1) === '/') {
    // Disallow requiring a file as a directory
    if (!stat.isDirectory()) {
      throw Helpers.getError(givenRequest, parent, config)
    }
    const resolved = await resolveAsDirectory(request, parent, config)
    if (resolved) {
      return resolved
    }
    throw Helpers.getError(givenRequest, parent, config)
  }
  // Use the request if it's a file and has a valid known extension
  if (stat && stat.isFile() && config.extensions.has(Path.extname(request))) {
    return request
  }
  const resolved = (
    await resolveAsFile(request, config) ||
    await resolveAsDirectory(request, parent, config, givenRequest)
  )
  if (resolved) {
    return resolved
  }
  throw Helpers.getError(givenRequest, parent, config)
}

module.exports = {
  resolve,
  isCore: Helpers.isPathCore,
  isLocal: Helpers.isPathLocal,
}
