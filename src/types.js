/* @flow */

import type FS from 'fs'

/* eslint-disable import/prefer-default-export */

export type Config = {
  fs: {
    stat: ((filePath: string) => Promise<FS.Stats>),
    readFile: ((filePath: string) => Promise<string>)
  },
  root: ?string,
  process: ((manifest: Object) => string),
  extensions: Set<string>,
  moduleDirectories: Array<string>,
  items_searched: Array<string>,
}
