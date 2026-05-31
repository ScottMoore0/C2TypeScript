import { TscError } from "./tsc-error-parser.js";

export interface ClassifiedError {
  category: string;
  errorCode: number;
  file: string;
  line: number;
  col: number;
  message: string;
  data: {
    name?: string;
    fromType?: string;
    toType?: string;
    suggestion?: string;
    modulePath?: string;
    expectedArgs?: number;
    actualArgs?: number;
  };
}

function extract(msg: string, re: RegExp): string | undefined {
  const m = msg.match(re);
  return m ? m[1] : undefined;
}

function extractInt(msg: string, re: RegExp): number | undefined {
  const m = msg.match(re);
  return m ? parseInt(m[1], 10) : undefined;
}

export function classifyError(error: TscError): ClassifiedError {
  const base = {
    errorCode: error.code,
    file: error.file,
    line: error.line,
    col: error.col,
    message: error.message,
  };

  switch (error.code) {
    case 2304:
      return { ...base, category: "missing_name", data: {
        name: extract(error.message, /Cannot find name '([^']+)'/),
      }};
    case 2305:
      return { ...base, category: "missing_export", data: {
        name: extract(error.message, /has no exported member '([^']+)'/),
      }};
    case 2307:
      return { ...base, category: "missing_module", data: {
        modulePath: extract(error.message, /Cannot find module '([^']+)'/),
      }};
    case 2322:
      return { ...base, category: "type_mismatch", data: {
        fromType: extract(error.message, /Type '([^']+)' is not assignable/),
        toType: extract(error.message, /to type '([^']+)'/),
      }};
    case 2339:
      return { ...base, category: "missing_property", data: {
        name: extract(error.message, /Property '([^']+)' does not exist on type '([^']+)'/),
        fromType: extract(error.message, /on type '([^']+)'/),
      }};
    case 2345:
      return { ...base, category: "argument_mismatch", data: {
        fromType: extract(error.message, /Argument of type '([^']+)'/),
        toType: extract(error.message, /parameter of type '([^']+)'/),
      }};
    case 2551:
      return { ...base, category: "typo_suggestion", data: {
        name: extract(error.message, /Property '([^']+)' does not exist/),
        suggestion: extract(error.message, /Did you mean '([^']+)'/),
      }};
    case 2554:
      return { ...base, category: "argument_count", data: {
        expectedArgs: extractInt(error.message, /Expected (\d+)/),
        actualArgs: extractInt(error.message, /but got (\d+)/),
      }};
    case 2532:
      return { ...base, category: "possibly_undefined", data: {} };
    case 7006:
      return { ...base, category: "implicit_any", data: {
        name: extract(error.message, /Parameter '([^']+)'/),
      }};
    case 1002:
    case 1003:
    case 1005:
      return { ...base, category: "syntax_error", data: {} };
    case 2300:
    case 2696:
      return { ...base, category: "duplicate_decl", data: {
        name: extract(error.message, /Duplicate identifier '([^']+)'/),
      }};
    default:
      return { ...base, category: "unknown", data: {} };
  }
}
