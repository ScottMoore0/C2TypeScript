// FC-11: C locale functions.
// C17 §7.11: Localization.

/** Locale categories. */
export const LC_ALL = 0;
export const LC_COLLATE = 1;
export const LC_CTYPE = 2;
export const LC_MONETARY = 3;
export const LC_NUMERIC = 4;
export const LC_TIME = 5;

let _currentLocale = "C";

/** C17 §7.11.1.1: setlocale — set locale category. */
export function c_setlocale(category: number, locale: string | null): string | null {
  if (locale === null) return _currentLocale;
  if (locale === "" || locale === "C" || locale === "POSIX") {
    _currentLocale = "C";
    return "C";
  }
  // Only "C" locale is fully supported
  _currentLocale = locale;
  return locale;
}

/** C17 §7.11.2.1: localeconv — get numeric formatting info. */
export function c_localeconv(): {
  decimal_point: string;
  thousands_sep: string;
  grouping: string;
  int_curr_symbol: string;
  currency_symbol: string;
  mon_decimal_point: string;
  mon_thousands_sep: string;
  positive_sign: string;
  negative_sign: string;
} {
  return {
    decimal_point: ".",
    thousands_sep: "",
    grouping: "",
    int_curr_symbol: "",
    currency_symbol: "",
    mon_decimal_point: "",
    mon_thousands_sep: "",
    positive_sign: "",
    negative_sign: "-",
  };
}
