# ts-clibs-list

TypeScript port of [clibs/list](https://github.com/clibs/list), a simple, generic, doubly-linked list with iterator support originally written in C by TJ Holowaychuk and contributors.

## Installation

```
npm install ts-clibs-list
```

## Usage

```typescript
import {
  list_new,
  list_node_new,
  list_lpush,
  list_rpush,
  list_at,
  list_iterator_new,
  list_iterator_next,
  list_iterator_destroy,
  list_destroy,
  LIST_HEAD,
} from "ts-clibs-list";

const l = list_new()!;

// Append nodes at the tail.
list_rpush(l, list_node_new("one")!);
list_rpush(l, list_node_new("two")!);

// Prepend at the head.
list_lpush(l, list_node_new("zero")!);

// Random access by index. Negative indices count from the tail.
console.log(list_at(l, 0)?.val);   // "zero"
console.log(list_at(l, -1)?.val);  // "two"

// Iterate from head to tail.
const it = list_iterator_new(l, LIST_HEAD);
for (let n = list_iterator_next(it); n; n = list_iterator_next(it)) {
  console.log(n.val);
}
list_iterator_destroy(it);

list_destroy(l);
```

## API

### Constants

- `LIST_HEAD`, `LIST_TAIL` - iteration directions.

### Types

- `list_t` - list container with `head`, `tail`, `len`, optional `free` and `match` callbacks.
- `list_node` - node with `prev`, `next`, `val`.
- `list_iterator_t` - iterator state.

### Functions

- `list_new(): list_t | null` - create an empty list.
- `list_destroy(self)` - free a list and all its nodes.
- `list_node_new(val): list_node | null` - create a node holding `val`.
- `list_rpush(self, node)` - append at the tail.
- `list_lpush(self, node)` - prepend at the head.
- `list_rpop(self)` - remove and return the tail node.
- `list_lpop(self)` - remove and return the head node.
- `list_at(self, index)` - return the node at `index` (negative counts from tail).
- `list_find(self, val)` - find a node by value, using `self.match` if set or strict equality otherwise.
- `list_remove(self, node)` - unlink a node from the list.
- `list_iterator_new(list, direction)` - create an iterator at the head or tail.
- `list_iterator_new_from_node(node, direction)` - create an iterator starting at `node`.
- `list_iterator_next(self)` - advance the iterator and return the current node.
- `list_iterator_destroy(self)` - free the iterator.

## Notes

This package is an automated TypeScript translation of the original C library. The translated code preserves the C semantics (including the `// BRIDGE:` markers that pinpoint where C concepts cross into TypeScript), so the API matches the upstream C API one-for-one.

## License

MIT. See [LICENSE](./LICENSE) for the original clibs copyright and the translation copyright.
