// Levenshtein distance reference vectors from the textbook
// (Wagner-Fischer 1974, plus Wikipedia "Levenshtein distance" examples).
import { distance, normalisedDistance, similarity } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want, eps = 0) {
  const ok = typeof want === 'number' && eps > 0
    ? Math.abs(got - want) < eps
    : got === want;
  if (ok) { console.log(`ok ${name} → ${got}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// Empty / identical inputs
check('distance("", "")',             distance('', ''),             0);
check('distance("a", "a")',           distance('a', 'a'),           0);
check('distance("", "abc")',          distance('', 'abc'),          3);
check('distance("abc", "")',          distance('abc', ''),          3);

// Wikipedia / textbook examples
check('distance("kitten", "sitting")',   distance('kitten', 'sitting'),    3);
check('distance("Saturday", "Sunday")',  distance('Saturday', 'Sunday'),   3);
check('distance("flaw", "lawn")',        distance('flaw', 'lawn'),         2);
check('distance("intention", "execution")', distance('intention', 'execution'), 5);

// Symmetric: d(a,b) == d(b,a)
check('symmetric distance("hello","world")',
      distance('hello', 'world'),
      distance('world', 'hello'));

// Triangle inequality (d(a,c) ≤ d(a,b) + d(b,c))
{
  const a = 'cat', b = 'cot', c = 'cog';
  const triangle = distance(a, b) + distance(b, c);
  check('triangle inequality holds: d("cat","cog") ≤ d("cat","cot") + d("cot","cog")',
    distance(a, c) <= triangle, true);
}

// Single substitution = distance 1
check('distance("cat", "car") = 1', distance('cat', 'car'), 1);
check('distance("cat", "bat") = 1', distance('cat', 'bat'), 1);

// Single insertion = distance 1
check('distance("cat", "cats") = 1', distance('cat', 'cats'), 1);
check('distance("cats", "cat") = 1', distance('cats', 'cat'), 1);

// Disjoint strings of same length
check('distance("aaaa", "bbbb") = 4', distance('aaaa', 'bbbb'), 4);

// normalisedDistance
check('normalisedDistance("", "")',          normalisedDistance('', ''),          0);
check('normalisedDistance("abc", "abc")',    normalisedDistance('abc', 'abc'),    0);
check('normalisedDistance("kitten", "sitting") = 3/7',
      normalisedDistance('kitten', 'sitting'), 3 / 7, 1e-12);

// similarity
check('similarity("abc", "abc") = 1', similarity('abc', 'abc'), 1);
check('similarity("aaaa", "bbbb") = 0', similarity('aaaa', 'bbbb'), 0);

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
