'use strict'

/* @flow */

import type FS from 'fs'

export type Config = {
  fs: {
    stat: ((filePath: string) => Promise<FS.Stats>),
    readFile: ((filePath: string) => Promise<string>)
  },
  extensions: Array<string>,
  packageMains: Array<string>,
  moduleDirectories: Array<string>,
}
