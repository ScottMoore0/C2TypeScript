/**
 * ts-clibs-list - TypeScript port of clibs/list (https://github.com/clibs/list)
 *
 * A doubly-linked list with iterator support, originally written in C by
 * TJ Holowaychuk and contributors. Translated to TypeScript by Scott Moore.
 *
 * Licensed under the MIT License.
 */

// Core list type, node type, iterator struct, direction constants, and the
// list_* operation API. The class declarations live in list.ts so consumers
// see a single canonical definition.
export {
  LIST_HEAD,
  LIST_TAIL,
  list_node,
  list_t,
  list_iterator_t,
  list_new,
  list_destroy,
  list_rpush,
  list_rpop,
  list_lpop,
  list_lpush,
  list_find,
  list_at,
  list_remove,
} from "./src/list.js";

// Iterator constructors and stepping API.
export {
  list_iterator_new,
  list_iterator_new_from_node,
  list_iterator_next,
  list_iterator_destroy,
} from "./src/list_iterator.js";

// Node constructor.
export {
  list_node_new,
} from "./src/list_node.js";
