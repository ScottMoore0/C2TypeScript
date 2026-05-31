// AC-3 helper: source-text canonicalisation for region-id computation.
//
// The canonicalisation rule is deliberately minimal so that region IDs are
// stable across formatting changes (the most common kind of source change)
// while still distinguishing meaningful edits:
//
//   - All whitespace runs (spaces, tabs, newlines, CR, etc.) are collapsed
//     to a single space
//   - Leading and trailing whitespace on the whole text is removed
//
// Identifiers, punctuation, and operator characters are left untouched.
// Renaming a variable inside a region therefore changes its hash; reformatting
// the surrounding whitespace, indentation, or line breaks does not.
//
// This is the simplest rule that gives the right behaviour: the canonical
// form of `int main(void) {\n  return 0;\n}` and `int   main(void)   {   return   0;   }`
// is the same string `int main(void) { return 0; }` regardless of which
// formatting the source happened to use.

export function canonicalizeSourceText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}
