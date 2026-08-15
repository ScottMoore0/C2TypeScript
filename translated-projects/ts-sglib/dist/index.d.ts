/**
 * ts-sglib
 *
 * TypeScript port of SGLIB (Simple Generic Library), originally written in
 * ANSI C by Marian Vittek (2003-2005). Mirror maintained by Stefan Tauner at
 * https://github.com/stefanct/sglib.
 *
 * TypeScript translation copyright (c) 2026 Scott Moore.
 * Licensed under the MIT License.
 *
 * SGLIB's C source uses preprocessor macros to instantiate generic data
 * structures over arbitrary element types. C macros do not survive
 * C-to-TypeScript translation, so this package ships a fixed set of
 * pre-instantiated element types and the operations generated for each:
 *
 *   - LIST<int_node>          (singly-linked, integer payload)
 *   - LIST<str_node_list>     (singly-linked, string-keyed)
 *   - LIST<intkv_node>        (singly-linked, int-keyed entries)
 *   - DL_LIST<int_node_dl>    (doubly-linked, integer payload)
 *   - SORTED_LIST<int_node_sl> (sorted singly-linked, integer payload)
 *   - RBTREE<int_node_rb>     (red-black tree, integer payload)
 *   - HASHED_CONTAINER<intkv_node> (open-addressed hash table)
 *
 * If you need SGLIB instantiated for a different element type, fork the
 * source driver.c (in the cpp-to-ts repository, fixture sglib-full), edit
 * the typedefs and SGLIB_DEFINE_* macro invocations, re-run the translator,
 * and use the resulting driver.ts.
 */
export { int_node, str_node_list, int_node_dl, int_node_rb, int_node_sl, intkv_node, } from "./driver.js";
export { sglib_int_node_iterator, sglib_str_node_list_iterator, sglib_intkv_node_iterator, sglib_int_node_dl_iterator, sglib_int_node_sl_iterator, sglib_int_node_rb_iterator, sglib_hashed_intkv_node_iterator, } from "./driver.js";
export { sglib_int_node_add, sglib_int_node_add_if_not_member, sglib_int_node_concat, sglib_int_node_delete, sglib_int_node_delete_if_member, sglib_int_node_is_member, sglib_int_node_find_member, sglib_int_node_sort, sglib_int_node_len, sglib_int_node_reverse, sglib_int_node_it_init, sglib_int_node_it_init_on_equal, sglib_int_node_it_current, sglib_int_node_it_next, } from "./driver.js";
export { sglib_str_node_list_add, sglib_str_node_list_add_if_not_member, sglib_str_node_list_concat, sglib_str_node_list_delete, sglib_str_node_list_delete_if_member, sglib_str_node_list_is_member, sglib_str_node_list_find_member, sglib_str_node_list_sort, sglib_str_node_list_len, sglib_str_node_list_reverse, sglib_str_node_list_it_init, sglib_str_node_list_it_init_on_equal, sglib_str_node_list_it_current, sglib_str_node_list_it_next, } from "./driver.js";
export { sglib_intkv_node_add, sglib_intkv_node_add_if_not_member, sglib_intkv_node_concat, sglib_intkv_node_delete, sglib_intkv_node_delete_if_member, sglib_intkv_node_is_member, sglib_intkv_node_find_member, sglib_intkv_node_sort, sglib_intkv_node_len, sglib_intkv_node_reverse, sglib_intkv_node_it_init, sglib_intkv_node_it_init_on_equal, sglib_intkv_node_it_current, sglib_intkv_node_it_next, } from "./driver.js";
export { sglib_int_node_dl_add, sglib_int_node_dl_add_after, sglib_int_node_dl_add_after_if_not_member, sglib_int_node_dl_add_before, sglib_int_node_dl_add_before_if_not_member, sglib_int_node_dl_add_if_not_member, sglib_int_node_dl_concat, sglib_int_node_dl_delete, sglib_int_node_dl_delete_if_member, sglib_int_node_dl_find_member, sglib_int_node_dl_get_first, sglib_int_node_dl_get_last, sglib_int_node_dl_is_member, sglib_int_node_dl_len, sglib_int_node_dl_reverse, sglib_int_node_dl_sort, sglib_int_node_dl_it_init, sglib_int_node_dl_it_init_on_equal, sglib_int_node_dl_it_current, sglib_int_node_dl_it_next, } from "./driver.js";
export { sglib_int_node_sl_add, sglib_int_node_sl_add_if_not_member, sglib_int_node_sl_delete, sglib_int_node_sl_delete_if_member, sglib_int_node_sl_find_member, sglib_int_node_sl_is_member, sglib_int_node_sl_len, sglib_int_node_sl_sort, sglib_int_node_sl_it_init, sglib_int_node_sl_it_init_on_equal, sglib_int_node_sl_it_current, sglib_int_node_sl_it_next, } from "./driver.js";
export { sglib_int_node_rb_add, sglib_int_node_rb_add_if_not_member, sglib_int_node_rb_delete, sglib_int_node_rb_delete_if_member, sglib_int_node_rb_find_member, sglib_int_node_rb_is_member, sglib_int_node_rb_len, sglib_int_node_rb_it_init, sglib_int_node_rb_it_init_inorder, sglib_int_node_rb_it_init_preorder, sglib_int_node_rb_it_init_postorder, sglib_int_node_rb_it_init_on_equal, sglib_int_node_rb_it_current, sglib_int_node_rb_it_next, } from "./driver.js";
export { sglib_hashed_intkv_node_init, sglib_hashed_intkv_node_add, sglib_hashed_intkv_node_add_if_not_member, sglib_hashed_intkv_node_delete, sglib_hashed_intkv_node_delete_if_member, sglib_hashed_intkv_node_find_member, sglib_hashed_intkv_node_is_member, sglib_hashed_intkv_node_it_init, sglib_hashed_intkv_node_it_init_on_equal, sglib_hashed_intkv_node_it_current, sglib_hashed_intkv_node_it_next, } from "./driver.js";
export { sglib_full_smoke, sglib_full_probe_int_list_len, sglib_full_probe_int_list_reverse_first, sglib_full_probe_str_list_len, sglib_full_probe_dl_first_last, sglib_full_probe_dl_len, sglib_full_probe_rbtree_find, sglib_full_probe_hash_find, sglib_full_probe_sorted_head, } from "./driver.js";
