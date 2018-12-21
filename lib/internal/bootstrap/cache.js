'use strict';

// This is only exposed for internal build steps and testing purposes.
// We create new copies of the source and the code cache
// so the resources eventually used to compile builtin modules
// cannot be tampered with even with --expose-internals.

const { NativeModule } = require('internal/bootstrap/loaders');
const {
  source, getCodeCache, compileFunction
} = internalBinding('native_module');
const { hasTracing } = process.binding('config');

const depsModule = Object.keys(source).filter(
  (key) => NativeModule.isDepsModule(key) || key.startsWith('internal/deps')
);

// Modules with source code compiled in js2c that
// cannot be compiled with the code cache.
const cannotUseCache = [
  'sys',  // Deprecated.
  'internal/v8_prof_polyfill',
  'internal/v8_prof_processor',

  'internal/per_context',

  'internal/test/binding',
  // TODO(joyeecheung): update the C++ side so that
  // the code cache is also used when compiling these two files.
  'internal/bootstrap/loaders',
  'internal/bootstrap/node'
].concat(depsModule);

// Skip modules that cannot be required when they are not
// built into the binary.
if (process.config.variables.v8_enable_inspector !== 1) {
  cannotUseCache.push(
    'inspector',
    'internal/util/inspector',
  );
}
if (!hasTracing) {
  cannotUseCache.push('trace_events');
}
if (!process.versions.openssl) {
  cannotUseCache.push(
    'crypto',
    'https',
    'http2',
    'tls',
    '_tls_common',
    '_tls_wrap',
    'internal/crypto/certificate',
    'internal/crypto/cipher',
    'internal/crypto/diffiehellman',
    'internal/crypto/hash',
    'internal/crypto/keygen',
    'internal/crypto/pbkdf2',
    'internal/crypto/random',
    'internal/crypto/scrypt',
    'internal/crypto/sig',
    'internal/crypto/util',
    'internal/http2/core',
    'internal/http2/compat',
    'internal/streams/lazy_transform',
  );
}

module.exports = {
  cachableBuiltins: Object.keys(source).filter(
    (key) => !cannotUseCache.includes(key)
  ),
  getSource(id) { return source[id]; },
  getCodeCache,
  compileFunction,
  cannotUseCache
};
