/**
 * ts-inih -- TypeScript port of inih (INI file parser)
 *
 * A zero-dependency TypeScript implementation of inih, a simple INI file
 * parser originally written in C by Ben Hoyt.
 */

export {
  ini_parse,
  ini_parse_file,
  ini_parse_stream,
  ini_parse_string,
  ini_parse_string_length,
  ini_parse_string_ctx,
} from './ini.js';
