/**
 * ts-parson
 *
 * A zero-dependency TypeScript port of parson, a lightweight JSON parser
 * and serializer originally written in C by Krzysztof Gabis. parson
 * builds an in-memory tree of values with object/array/string/number/
 * boolean/null types and provides a small accessor API for reading and
 * mutating that tree.
 *
 * Original C: copyright (c) 2012 - 2023 Krzysztof Gabis, MIT.
 * TypeScript translation: copyright (c) 2026 Scott Moore, released
 * under the same MIT license.
 *
 * See: https://github.com/kgabis/parson
 */

// JSON_Value_Type enum constants (parson.h)
export {
  JSONError,
  JSONNull,
  JSONString,
  JSONNumber,
  JSONObject,
  JSONArray,
  JSONBoolean,
} from './parson.js';

// JSON_Status enum constants (parson.h)
export {
  JSONSuccess,
  JSONFailure,
} from './parson.js';

// Parsing
export {
  json_parse_string,
  json_parse_string_with_comments,
  json_parse_file,
  json_parse_file_with_comments,
} from './parson.js';

// Value introspection
export {
  json_value_get_type,
  json_value_get_object,
  json_value_get_array,
  json_value_get_string,
  json_value_get_string_len,
  json_value_get_number,
  json_value_get_boolean,
  json_value_get_parent,
  json_value_free,
  json_value_equals,
  json_value_deep_copy,
} from './parson.js';

// Value constructors
export {
  json_value_init_object,
  json_value_init_array,
  json_value_init_string,
  json_value_init_string_with_len,
  json_value_init_number,
  json_value_init_boolean,
  json_value_init_null,
} from './parson.js';

// Object accessors (read)
export {
  json_object_get_value,
  json_object_get_string,
  json_object_get_string_len,
  json_object_get_number,
  json_object_get_object,
  json_object_get_array,
  json_object_get_boolean,
  json_object_get_count,
  json_object_get_name,
  json_object_get_value_at,
  json_object_get_wrapping_value,
  json_object_has_value,
  json_object_has_value_of_type,
} from './parson.js';

// Object dotted accessors (read)
export {
  json_object_dotget_value,
  json_object_dotget_string,
  json_object_dotget_string_len,
  json_object_dotget_number,
  json_object_dotget_object,
  json_object_dotget_array,
  json_object_dotget_boolean,
  json_object_dothas_value,
  json_object_dothas_value_of_type,
} from './parson.js';

// Object mutators
export {
  json_object_set_value,
  json_object_set_string,
  json_object_set_string_with_len,
  json_object_set_number,
  json_object_set_boolean,
  json_object_set_null,
  json_object_dotset_value,
  json_object_dotset_string,
  json_object_dotset_string_with_len,
  json_object_dotset_number,
  json_object_dotset_boolean,
  json_object_dotset_null,
  json_object_remove,
  json_object_dotremove,
  json_object_clear,
} from './parson.js';

// Array accessors (read)
export {
  json_array_get_value,
  json_array_get_string,
  json_array_get_string_len,
  json_array_get_number,
  json_array_get_object,
  json_array_get_array,
  json_array_get_boolean,
  json_array_get_count,
  json_array_get_wrapping_value,
} from './parson.js';

// Array mutators
export {
  json_array_remove,
  json_array_replace_value,
  json_array_replace_string,
  json_array_replace_string_with_len,
  json_array_replace_number,
  json_array_replace_boolean,
  json_array_replace_null,
  json_array_clear,
  json_array_append_value,
  json_array_append_string,
  json_array_append_string_with_len,
  json_array_append_number,
  json_array_append_boolean,
  json_array_append_null,
} from './parson.js';

// Serialization
export {
  json_serialization_size,
  json_serialize_to_buffer,
  json_serialize_to_file,
  json_serialize_to_string,
  json_serialization_size_pretty,
  json_serialize_to_buffer_pretty,
  json_serialize_to_file_pretty,
  json_serialize_to_string_pretty,
  json_free_serialized_string,
} from './parson.js';

// Validation
export {
  json_validate,
} from './parson.js';

// Short-name aliases (parson.h convenience macros)
export {
  json_type,
  json_object,
  json_array,
  json_string_len,
  json_number,
  json_boolean,
} from './parson.js';

// Library-wide configuration
export {
  json_set_allocation_functions,
  json_set_escape_slashes,
  json_set_float_serialization_format,
  json_set_number_serialization_function,
} from './parson.js';
