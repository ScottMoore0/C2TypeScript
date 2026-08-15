// Damerau-Levenshtein (OSA variant) test vectors.
import { distance, damerauDistance, normalisedDamerauDistance, similarity, damerauSimilarity } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name} → ${got}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// Levenshtein should match published distances
check('lev("", "")',                  distance('', ''),                  0);
check('lev("kitten", "sitting")',     distance('kitten', 'sitting'),     3);
check('lev("Saturday", "Sunday")',    distance('Saturday', 'Sunday'),    3);
check('lev("ab", "ba")',              distance('ab', 'ba'),              2);
check('lev("abc", "acb")',            distance('abc', 'acb'),            2);

// Damerau-Levenshtein OSA: transpositions cost 1
check('dam("", "")',                  damerauDistance('', ''),           0);
check('dam("abc", "abc")',            damerauDistance('abc', 'abc'),     0);
check('dam("ab", "ba") — single transposition',
                                      damerauDistance('ab', 'ba'),       1);
check('dam("abc", "acb") — adjacent swap',
                                      damerauDistance('abc', 'acb'),     1);

// Damerau ≤ Levenshtein for all pairs (transposition is at most as expensive)
{
  const pairs = [
    ['abc', 'abc'], ['ab', 'ba'], ['kitten', 'sitting'],
    ['hello', 'world'], ['', 'abc'], ['xyz', '']
  ];
  let allLE = true;
  for (const [a, b] of pairs) {
    if (damerauDistance(a, b) > distance(a, b)) { allLE = false; break; }
  }
  check('damerau ≤ levenshtein for all test pairs', allLE, true);
}

// Symmetry
check('dam("hello","world") == dam("world","hello")',
  damerauDistance('hello', 'world'),
  damerauDistance('world', 'hello'));

// Real-world: typos
check('"recieve" vs "receive" (one transposition) = 1',
  damerauDistance('recieve', 'receive'), 1);
check('"teh" vs "the" (one transposition) = 1',
  damerauDistance('teh', 'the'), 1);
check('"recieve" Levenshtein = 2 (not transposition-aware)',
  distance('recieve', 'receive'), 2);

// Similarity score
check('similarity("abc", "abc") = 1',                similarity('abc', 'abc'),         1);
check('damerauSimilarity("ab", "ba") = 0.5',         damerauSimilarity('ab', 'ba'),    0.5);

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
