'use strict'

/* @flow */

import type FS from 'fs'

export type Resolve$Config = {
  fs: {
    stat: Promise<FS.Stats>,
    readFile: Promise<string>
  },
  root: Array<string>,
  alias: Object, // <string, string>
  extensions: Array<string>,
  packageMains: Array<string>,
  moduleDirectories: Array<string>,
}

export type Resolve$Config$User = {
  fs?: {
    stat?: Promise<FS.Stats>,
    readFile?: Promise<string>
  },
  root?: string | Array<string>,
  alias?: Object,
  extensions?: Array<string>,
  packageMains?: Array<string>,
  moduleDirectories?: Array<string>
}
