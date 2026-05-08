interface CPtr {
    buf: Uint8Array;
    off: number;
}
export declare class int_node {
    v: number;
    next: int_node | null;
    prev: int_node | null;
    left: int_node | null;
    right: int_node | null;
    color: number;
    constructor();
}
export declare class str_node_list {
    key: string;
    next: str_node_list | null;
    constructor();
}
export declare class int_node_sl {
    v: number;
    next: int_node_sl | null;
    constructor();
}
export declare class int_node_rb {
    v: number;
    left: int_node_rb | null;
    right: int_node_rb | null;
    color: number;
    constructor();
}
export declare class int_node_dl {
    v: number;
    next: int_node_dl | null;
    prev: int_node_dl | null;
    constructor();
}
export declare class intkv_node {
    k: number;
    v: number;
    next_in_chain: intkv_node | null;
    constructor();
}
export declare class sglib_int_node_iterator {
    currentelem: int_node | null;
    nextelem: int_node | null;
    subcomparator: (arg0: int_node | null, arg1: int_node | null) => number;
    equalto: int_node | null;
    constructor();
}
export declare function sglib_int_node_is_member(list: int_node | null, elem: int_node | null): number;
export declare function sglib_int_node_find_member(list: int_node | null, elem: int_node | null): int_node | null;
export declare function sglib_int_node_add_if_not_member(list: {
    value: int_node | null;
}, elem: int_node | null, member: {
    value: int_node | null;
}): number;
export declare function sglib_int_node_add(list: {
    value: int_node | null;
}, elem: int_node | null): void;
export declare function sglib_int_node_concat(first: {
    value: int_node | null;
}, second: int_node | null): void;
export declare function sglib_int_node_delete(list: {
    value: int_node | null;
}, elem: int_node | null): void;
export declare function sglib_int_node_delete_if_member(list: {
    value: int_node | null;
}, elem: int_node | null, member: {
    value: int_node | null;
}): number;
export declare function sglib_int_node_sort(list: {
    value: int_node | null;
}): void;
export declare function sglib_int_node_len(list: int_node | null): number;
export declare function sglib_int_node_reverse(list: {
    value: int_node | null;
}): void;
export declare function sglib_int_node_it_init_on_equal(it: sglib_int_node_iterator | null, list: int_node | null, subcomparator: (arg0: int_node | null, arg1: int_node | null) => number, equalto: int_node | null): int_node | null;
export declare function sglib_int_node_it_init(it: sglib_int_node_iterator | null, list: int_node | null): int_node | null;
export declare function sglib_int_node_it_current(it: sglib_int_node_iterator | null): int_node | null;
export declare function sglib_int_node_it_next(it: sglib_int_node_iterator | null): int_node | null;
export declare class sglib_str_node_list_iterator {
    currentelem: str_node_list | null;
    nextelem: str_node_list | null;
    subcomparator: (arg0: str_node_list | null, arg1: str_node_list | null) => number;
    equalto: str_node_list | null;
    constructor();
}
export declare function sglib_str_node_list_is_member(list: str_node_list | null, elem: str_node_list | null): number;
export declare function sglib_str_node_list_find_member(list: str_node_list | null, elem: str_node_list | null): str_node_list | null;
export declare function sglib_str_node_list_add_if_not_member(list: {
    value: str_node_list | null;
}, elem: str_node_list | null, member: {
    value: str_node_list | null;
}): number;
export declare function sglib_str_node_list_add(list: {
    value: str_node_list | null;
}, elem: str_node_list | null): void;
export declare function sglib_str_node_list_concat(first: {
    value: str_node_list | null;
}, second: str_node_list | null): void;
export declare function sglib_str_node_list_delete(list: {
    value: str_node_list | null;
}, elem: str_node_list | null): void;
export declare function sglib_str_node_list_delete_if_member(list: {
    value: str_node_list | null;
}, elem: str_node_list | null, member: {
    value: str_node_list | null;
}): number;
export declare function sglib_str_node_list_sort(list: {
    value: str_node_list | null;
}): void;
export declare function sglib_str_node_list_len(list: str_node_list | null): number;
export declare function sglib_str_node_list_reverse(list: {
    value: str_node_list | null;
}): void;
export declare function sglib_str_node_list_it_init_on_equal(it: sglib_str_node_list_iterator | null, list: str_node_list | null, subcomparator: (arg0: str_node_list | null, arg1: str_node_list | null) => number, equalto: str_node_list | null): str_node_list | null;
export declare function sglib_str_node_list_it_init(it: sglib_str_node_list_iterator | null, list: str_node_list | null): str_node_list | null;
export declare function sglib_str_node_list_it_current(it: sglib_str_node_list_iterator | null): str_node_list | null;
export declare function sglib_str_node_list_it_next(it: sglib_str_node_list_iterator | null): str_node_list | null;
export declare class sglib_int_node_dl_iterator {
    currentelem: int_node_dl | null;
    prevelem: int_node_dl | null;
    nextelem: int_node_dl | null;
    subcomparator: (arg0: int_node_dl | null, arg1: int_node_dl | null) => number;
    equalto: int_node_dl | null;
    constructor();
}
export declare function sglib_int_node_dl_add(list: {
    value: int_node_dl | null;
}, elem: int_node_dl | null): void;
export declare function sglib_int_node_dl_add_after(list: {
    value: int_node_dl | null;
}, elem: int_node_dl | null): void;
export declare function sglib_int_node_dl_add_before(list: {
    value: int_node_dl | null;
}, elem: int_node_dl | null): void;
export declare function sglib_int_node_dl_add_if_not_member(list: {
    value: int_node_dl | null;
}, elem: int_node_dl | null, member: {
    value: int_node_dl | null;
}): number;
export declare function sglib_int_node_dl_add_after_if_not_member(list: {
    value: int_node_dl | null;
}, elem: int_node_dl | null, member: {
    value: int_node_dl | null;
}): number;
export declare function sglib_int_node_dl_add_before_if_not_member(list: {
    value: int_node_dl | null;
}, elem: int_node_dl | null, member: {
    value: int_node_dl | null;
}): number;
export declare function sglib_int_node_dl_concat(first: {
    value: int_node_dl | null;
}, second: int_node_dl | null): void;
export declare function sglib_int_node_dl_delete(list: {
    value: int_node_dl | null;
}, elem: int_node_dl | null): void;
export declare function sglib_int_node_dl_delete_if_member(list: {
    value: int_node_dl | null;
}, elem: int_node_dl | null, member: {
    value: int_node_dl | null;
}): number;
export declare function sglib_int_node_dl_is_member(list: int_node_dl | null, elem: int_node_dl | null): number;
export declare function sglib_int_node_dl_find_member(list: int_node_dl | null, elem: int_node_dl | null): int_node_dl | null;
export declare function sglib_int_node_dl_get_first(list: int_node_dl | null): int_node_dl | null;
export declare function sglib_int_node_dl_get_last(list: int_node_dl | null): int_node_dl | null;
export declare function sglib_int_node_dl_sort(list: {
    value: int_node_dl | null;
}): void;
export declare function sglib_int_node_dl_len(list: int_node_dl | null): number;
export declare function sglib_int_node_dl_reverse(list: {
    value: int_node_dl | null;
}): void;
export declare function sglib_int_node_dl_it_init_on_equal(it: sglib_int_node_dl_iterator | null, list: int_node_dl | null, subcomparator: (arg0: int_node_dl | null, arg1: int_node_dl | null) => number, equalto: int_node_dl | null): int_node_dl | null;
export declare function sglib_int_node_dl_it_init(it: sglib_int_node_dl_iterator | null, list: int_node_dl | null): int_node_dl | null;
export declare function sglib_int_node_dl_it_current(it: sglib_int_node_dl_iterator | null): int_node_dl | null;
export declare function sglib_int_node_dl_it_next(it: sglib_int_node_dl_iterator | null): int_node_dl | null;
export declare class sglib_int_node_rb_iterator {
    currentelem: int_node_rb | null;
    pass: any;
    path: any;
    pathi: number;
    order: number;
    equalto: int_node_rb | null;
    subcomparator: (arg0: int_node_rb | null, arg1: int_node_rb | null) => number;
    constructor();
}
export declare function sglib___int_node_rb_delete_recursive(tree: {
    value: int_node_rb | null;
}, elem: int_node_rb | null): number;
export declare function sglib_int_node_rb_add(tree: {
    value: int_node_rb | null;
}, elem: int_node_rb | null): void;
export declare function sglib_int_node_rb_delete(tree: {
    value: int_node_rb | null;
}, elem: int_node_rb | null): void;
export declare function sglib_int_node_rb_find_member(t: int_node_rb | null, elem: int_node_rb | null): int_node_rb | null;
export declare function sglib_int_node_rb_is_member(t: int_node_rb | null, elem: int_node_rb | null): number;
export declare function sglib_int_node_rb_delete_if_member(tree: {
    value: int_node_rb | null;
}, elem: int_node_rb | null, memb: {
    value: int_node_rb | null;
}): number;
export declare function sglib_int_node_rb_add_if_not_member(tree: {
    value: int_node_rb | null;
}, elem: int_node_rb | null, memb: {
    value: int_node_rb | null;
}): number;
export declare function sglib_int_node_rb_len(t: int_node_rb | null): number;
export declare function sglib__int_node_rb_it_compute_current_elem(it: sglib_int_node_rb_iterator | null): void;
export declare function sglib__int_node_rb_it_init(it: sglib_int_node_rb_iterator | null, tree: int_node_rb | null, order: number, subcomparator: (arg0: int_node_rb | null, arg1: int_node_rb | null) => number, equalto: int_node_rb | null): int_node_rb | null;
export declare function sglib_int_node_rb_it_init(it: sglib_int_node_rb_iterator | null, tree: int_node_rb | null): int_node_rb | null;
export declare function sglib_int_node_rb_it_init_preorder(it: sglib_int_node_rb_iterator | null, tree: int_node_rb | null): int_node_rb | null;
export declare function sglib_int_node_rb_it_init_inorder(it: sglib_int_node_rb_iterator | null, tree: int_node_rb | null): int_node_rb | null;
export declare function sglib_int_node_rb_it_init_postorder(it: sglib_int_node_rb_iterator | null, tree: int_node_rb | null): int_node_rb | null;
export declare function sglib_int_node_rb_it_init_on_equal(it: sglib_int_node_rb_iterator | null, tree: int_node_rb | null, subcomparator: (arg0: int_node_rb | null, arg1: int_node_rb | null) => number, equalto: int_node_rb | null): int_node_rb | null;
export declare function sglib_int_node_rb_it_current(it: sglib_int_node_rb_iterator | null): int_node_rb | null;
export declare function sglib_int_node_rb_it_next(it: sglib_int_node_rb_iterator | null): int_node_rb | null;
export declare function sglib___int_node_rb_consistency_check(t: int_node_rb | null): void;
export declare class sglib_intkv_node_iterator {
    currentelem: intkv_node | null;
    nextelem: intkv_node | null;
    subcomparator: (arg0: intkv_node | null, arg1: intkv_node | null) => number;
    equalto: intkv_node | null;
    constructor();
}
export declare function sglib_intkv_node_is_member(list: intkv_node | null, elem: intkv_node | null): number;
export declare function sglib_intkv_node_find_member(list: intkv_node | null, elem: intkv_node | null): intkv_node | null;
export declare function sglib_intkv_node_add_if_not_member(list: {
    value: intkv_node | null;
}, elem: intkv_node | null, member: {
    value: intkv_node | null;
}): number;
export declare function sglib_intkv_node_add(list: {
    value: intkv_node | null;
}, elem: intkv_node | null): void;
export declare function sglib_intkv_node_concat(first: {
    value: intkv_node | null;
}, second: intkv_node | null): void;
export declare function sglib_intkv_node_delete(list: {
    value: intkv_node | null;
}, elem: intkv_node | null): void;
export declare function sglib_intkv_node_delete_if_member(list: {
    value: intkv_node | null;
}, elem: intkv_node | null, member: {
    value: intkv_node | null;
}): number;
export declare function sglib_intkv_node_sort(list: {
    value: intkv_node | null;
}): void;
export declare function sglib_intkv_node_len(list: intkv_node | null): number;
export declare function sglib_intkv_node_reverse(list: {
    value: intkv_node | null;
}): void;
export declare function sglib_intkv_node_it_init_on_equal(it: sglib_intkv_node_iterator | null, list: intkv_node | null, subcomparator: (arg0: intkv_node | null, arg1: intkv_node | null) => number, equalto: intkv_node | null): intkv_node | null;
export declare function sglib_intkv_node_it_init(it: sglib_intkv_node_iterator | null, list: intkv_node | null): intkv_node | null;
export declare function sglib_intkv_node_it_current(it: sglib_intkv_node_iterator | null): intkv_node | null;
export declare function sglib_intkv_node_it_next(it: sglib_intkv_node_iterator | null): intkv_node | null;
export declare class sglib_hashed_intkv_node_iterator {
    containerIt: sglib_intkv_node_iterator;
    table: CPtr | null;
    currentIndex: number;
    subcomparator: (arg0: intkv_node | null, arg1: intkv_node | null) => number;
    equalto: intkv_node | null;
    constructor();
}
export declare function sglib_hashed_intkv_node_init(table: {
    value: intkv_node | null;
}): void;
export declare function sglib_hashed_intkv_node_add(table: {
    value: intkv_node | null;
}, elem: intkv_node | null): void;
export declare function sglib_hashed_intkv_node_add_if_not_member(table: {
    value: intkv_node | null;
}, elem: intkv_node | null, member: {
    value: intkv_node | null;
}): number;
export declare function sglib_hashed_intkv_node_delete(table: {
    value: intkv_node | null;
}, elem: intkv_node | null): void;
export declare function sglib_hashed_intkv_node_delete_if_member(table: {
    value: intkv_node | null;
}, elem: intkv_node | null, memb: {
    value: intkv_node | null;
}): number;
export declare function sglib_hashed_intkv_node_is_member(table: {
    value: intkv_node | null;
}, elem: intkv_node | null): number;
export declare function sglib_hashed_intkv_node_find_member(table: {
    value: intkv_node | null;
}, elem: intkv_node | null): intkv_node | null;
export declare function sglib_hashed_intkv_node_it_init_on_equal(it: sglib_hashed_intkv_node_iterator | null, table: {
    value: intkv_node | null;
}, subcomparator: (arg0: intkv_node | null, arg1: intkv_node | null) => number, equalto: intkv_node | null): intkv_node | null;
export declare function sglib_hashed_intkv_node_it_init(it: sglib_hashed_intkv_node_iterator | null, table: {
    value: intkv_node | null;
}): intkv_node | null;
export declare function sglib_hashed_intkv_node_it_current(it: sglib_hashed_intkv_node_iterator | null): intkv_node | null;
export declare function sglib_hashed_intkv_node_it_next(it: sglib_hashed_intkv_node_iterator | null): intkv_node | null;
export declare class sglib_int_node_sl_iterator {
    currentelem: int_node_sl | null;
    nextelem: int_node_sl | null;
    subcomparator: (arg0: int_node_sl | null, arg1: int_node_sl | null) => number;
    equalto: int_node_sl | null;
    constructor();
}
export declare function sglib_int_node_sl_is_member(list: int_node_sl | null, elem: int_node_sl | null): number;
export declare function sglib_int_node_sl_find_member(list: int_node_sl | null, elem: int_node_sl | null): int_node_sl | null;
export declare function sglib_int_node_sl_add_if_not_member(list: {
    value: int_node_sl | null;
}, elem: int_node_sl | null, member: {
    value: int_node_sl | null;
}): number;
export declare function sglib_int_node_sl_add(list: {
    value: int_node_sl | null;
}, elem: int_node_sl | null): void;
export declare function sglib_int_node_sl_delete(list: {
    value: int_node_sl | null;
}, elem: int_node_sl | null): void;
export declare function sglib_int_node_sl_delete_if_member(list: {
    value: int_node_sl | null;
}, elem: int_node_sl | null, member: {
    value: int_node_sl | null;
}): number;
export declare function sglib_int_node_sl_len(list: int_node_sl | null): number;
export declare function sglib_int_node_sl_sort(list: {
    value: int_node_sl | null;
}): void;
export declare function sglib_int_node_sl_it_init_on_equal(it: sglib_int_node_sl_iterator | null, list: int_node_sl | null, subcomparator: (arg0: int_node_sl | null, arg1: int_node_sl | null) => number, equalto: int_node_sl | null): int_node_sl | null;
export declare function sglib_int_node_sl_it_init(it: sglib_int_node_sl_iterator | null, list: int_node_sl | null): int_node_sl | null;
export declare function sglib_int_node_sl_it_current(it: sglib_int_node_sl_iterator | null): int_node_sl | null;
export declare function sglib_int_node_sl_it_next(it: sglib_int_node_sl_iterator | null): int_node_sl | null;
export declare function sglib_full_smoke(): number;
export declare function sglib_full_probe_int_list_len(): number;
export declare function sglib_full_probe_int_list_reverse_first(): number;
export declare function sglib_full_probe_dl_first_last(): number;
export declare function sglib_full_probe_str_list_len(): number;
export declare function sglib_full_probe_dl_len(): number;
export declare function sglib_full_probe_rbtree_find(): number;
export declare function sglib_full_probe_hash_find(): number;
export declare function sglib_full_probe_sorted_head(): number;
export {};
