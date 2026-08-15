interface CPtr {
    buf: Uint8Array;
    off: number;
}
export declare const JSMN_UNDEFINED: number;
export declare const JSMN_OBJECT: number;
export declare const JSMN_ARRAY: number;
export declare const JSMN_STRING: number;
export declare const JSMN_PRIMITIVE: number;
type jsmntype_t = number;
export type jsmnerr = number;
export declare const JSMN_ERROR_NOMEM: number;
export declare const JSMN_ERROR_INVAL: number;
export declare const JSMN_ERROR_PART: number;
export declare class jsmntok {
    type: jsmntype_t;
    start: number;
    end: number;
    size: number;
    constructor();
}
declare const jsmntok_t: typeof jsmntok;
type jsmntok_t = jsmntok;
export declare class jsmn_parser {
    pos: number;
    toknext: number;
    toksuper: number;
    constructor();
}
export declare function jsmn_parse(parser: jsmn_parser | null, js: CPtr, len: number, tokens: jsmntok_t | null, num_tokens: number): number;
export declare function jsmn_init(parser: jsmn_parser | null): void;
export declare function main(): number;
export {};
