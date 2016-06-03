'use strict'

/* @flow */

import type FS from 'fs'

export type Config = {
  fs: {
    stat: ((filePath: string) => Promise<FS.Stats>),
    readFile: ((filePath: string) => Promise<string>)
  },
  root: ?string,
  process: ((manifest: Object) => string),
  extensions: Array<string>,
  moduleDirectories: Array<string>,
  items_searched: Array<string>,
}
