/**
 * ts-jsmn
 *
 * A zero-dependency TypeScript port of jsmn, a minimal JSON tokenizer
 * originally written in C by Serge Zaitsev. jsmn does not build a parsed
 * tree; instead it returns a flat array of tokens describing where each
 * JSON element begins and ends in the input string.
 *
 * Original C: copyright (c) 2010 Serge Zaitsev, MIT.
 * TypeScript translation: copyright (c) 2026 Scott Moore, released
 * under the same MIT license.
 *
 * See: https://github.com/zserge/jsmn
 */

// Token type constants (jsmntype enum)
export {
  JSMN_UNDEFINED,
  JSMN_OBJECT,
  JSMN_ARRAY,
  JSMN_STRING,
  JSMN_PRIMITIVE,
} from './jsmn.js';

// Error codes (jsmnerr enum)
export {
  JSMN_ERROR_NOMEM,
  JSMN_ERROR_INVAL,
  JSMN_ERROR_PART,
} from './jsmn.js';

// Public types
export { jsmnerr } from './jsmn.js';
export { jsmntok } from './jsmn.js';
export { jsmn_parser } from './jsmn.js';

// Public functions
export { jsmn_init, jsmn_parse } from './jsmn.js';
