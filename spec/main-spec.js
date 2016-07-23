'use babel'

import Path from 'path'
import { it } from 'jasmine-fix'
import { resolve } from '../'

describe('sb-resolve', function() {
  function getFixturePath(...paths) {
    return Path.join(__dirname, 'fixtures', ...paths)
  }

  it('throws a proper error', async function() {
    try {
      await resolve('./magic', __filename)
      expect(false).toBe(true)
    } catch (_) {
      expect(_.code).toBe('MODULE_NOT_FOUND')
    }
  })

  it('resolves absolute paths correctly', async function() {
    expect(await resolve(__filename, __filename)).toBe(__filename)
  })
  it('resolves dirs without manifests properly', async function() {
    expect(await resolve(getFixturePath('no-manifest'), __filename)).toBe(getFixturePath('no-manifest', 'index.json'))
  })
  it('resolves manifests without main properly', async function() {
    expect(await resolve(getFixturePath('manifest-no-main'), __filename)).toBe(getFixturePath('manifest-no-main', 'index.json'))
  })
  it('resolves properly if theres a dot in main', async function() {
    expect(await resolve(getFixturePath('dot-in-main'), __filename)).toBe(getFixturePath('dot-in-main', 'index.js'))
  })
  it('resolves properly with custom module directories', async function() {
    expect(await resolve('cool_module', getFixturePath('custom-module-dir', 'index.js'), {
      moduleDirectories: ['cool_modules'],
      root: getFixturePath('custom-module-dir'),
    })).toBe(getFixturePath('custom-module-dir', 'cool_modules', 'cool_module', 'index.json'))
  })
  it('resolves with proper priorities, just like node', async function() {
    expect(await resolve(getFixturePath('paths', 'magic'), __filename)).toBe(getFixturePath('paths', 'magic.js'))
    expect(await resolve(getFixturePath('paths', 'magic/'), __filename)).toBe(getFixturePath('paths', 'magic/index.js'))
  })
  it('resolves with proper priorities through manifests', async function() {
    expect(await resolve(getFixturePath('paths-complex', 'a'), __filename)).toBe(getFixturePath('paths-complex', 'a', 'src.js'))
    expect(await resolve(getFixturePath('paths-complex', 'b'), __filename)).toBe(getFixturePath('paths-complex', 'b', 'src/index.js'))
  })
  it('does deep resolution properly', async function() {
    expect(await resolve('cool_module/package.json', getFixturePath('custom-module-dir', 'index.js'), {
      moduleDirectories: ['cool_modules'],
      root: getFixturePath('custom-module-dir'),
    })).toBe(getFixturePath('custom-module-dir', 'cool_modules', 'cool_module', 'package.json'))
  })
  it('supports custom manifest process callback', async function() {
    expect(await resolve('./fixtures/manifest-process', __filename, {
      process(manifest) {
        return manifest.coolMain || './index'
      },
    })).toBe(getFixturePath('manifest-process', 'real.js'))
  })
  it('resolves relative stuff properly', async function() {
    expect(await resolve('./helpers-spec', __filename)).toBe(Path.join(__dirname, 'helpers-spec.js'))
  })
  it('resolves even if the module has dot in name and is a directory', async function() {
    expect(await resolve('./fixtures/dot.dot', __filename)).toBe(getFixturePath('dot.dot/index.js'))
  })
  it('resolves the file in favor of dir even when it has an ext', async function() {
    expect(await resolve('./fixtures/dir-has-ext/test', __filename)).toBe(getFixturePath('dir-has-ext/test.json'))
  })
  it('scans module directories properly', async function() {
    expect(await resolve('test/test', __filename, {
      moduleDirectories: [Path.join(__dirname, 'fixtures')],
    })).toBe(getFixturePath('test', 'test.json'))
  })
})
