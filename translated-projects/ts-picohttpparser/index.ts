/**
 * ts-picohttpparser
 *
 * TypeScript port of picohttpparser, a tiny HTTP/1.x request, response, and
 * header parser originally written in C by Kazuho Oku and used by HTTP::Parser::XS
 * and the h2o HTTP server.
 *
 * Original C version: copyright (c) 2009-2014 Kazuho Oku, Tokuhiro Matsuno,
 * Daisuke Murase, Shigeo Mitsunari. Licensed under the MIT License.
 * TypeScript translation: copyright (c) 2026 Scott Moore. Licensed under the
 * MIT License.
 *
 * Upstream: https://github.com/h2o/picohttpparser
 */

// Public parser entry points
export {
  phr_parse_request,
  phr_parse_response,
  phr_parse_headers,
  phr_decode_chunked,
  phr_decode_chunked_is_in_data,
  phr_header,
  phr_chunked_decoder,
} from './picohttpparser.js';
