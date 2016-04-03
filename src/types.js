'use strict'

/* @flow */

export type Resolve$Config = {
  root: Array<string>,
  alias: Object, // <string, string>
  extensions: Array<string>,
  packageMains: Array<string>,
  moduleDirectories: Array<string>,
}
