// Soundex reference vectors. The zoundx upstream implements the
// classical American Soundex algorithm (the older, simpler variant —
// not NARA/Census with H-as-vowel-separator rules).
import { soundex } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name} → ${got}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// Knuth TAOCP vol 3 §6.1 reference table
check('soundex("Robert")',   soundex('Robert'),   'R163');
check('soundex("Rupert")',   soundex('Rupert'),   'R163');
check('soundex("Rubin")',    soundex('Rubin'),    'R150');
check('soundex("Ashcraft")', soundex('Ashcraft'), 'A261');
check('soundex("Tymczak")',  soundex('Tymczak'),  'T522');
check('soundex("Honeyman")', soundex('Honeyman'), 'H555');

// Output shape
{
  const s = soundex('Smith');
  check('always 4 characters', s.length === 4, true);
  check('first character is uppercase letter', /^[A-Z]$/.test(s[0]), true);
  check('last 3 are digits', /^\d{3}$/.test(s.slice(1)), true);
}

// Robert and Rupert encode the same (the canonical example)
check('Robert and Rupert have same code (canonical example)',
  soundex('Robert') === soundex('Rupert'), true);

// Different surnames with similar pronunciation
check('soundex("Smith") === soundex("Smyth")',
  soundex('Smith'), soundex('Smyth'));

// Empty input
check('soundex("") returns empty string', soundex(''), '');

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
