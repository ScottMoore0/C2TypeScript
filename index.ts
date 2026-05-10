/**
 * ts-tiny-regex-c
 *
 * TypeScript port of tiny-regex-c, a small portable regex matcher in C
 * inspired by Rob Pike's regex code. Supports a useful subset of POSIX
 * regular expressions: '.', '^', '$', '*', '+', '?', character classes
 * '[abc]' / '[a-z]', and the shorthands \d \D \w \W \s \S.
 *
 * Original C version by kokke (https://github.com/kokke/tiny-regex-c),
 * released into the public domain (Unlicense).
 * TypeScript translation copyright (c) 2026 Scott Moore;
 * released under the same public-domain terms (Unlicense) as the upstream.
 */

export {
  re_match,
  re_matchp,
  re_compile,
  regex_t,
} from './re.js';
