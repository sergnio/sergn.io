declare global {
  // noinspection JSUnusedGlobalSymbols
  interface StringConstructor {
    empty: string;
  }
}

if (!("empty" in String)) {
  Object.defineProperty(String, "empty", {
    value: "",
    writable: false,
    configurable: false,
  });
}

/**
 * Needed, otherwise we get this Type error:
 * Augmentations for the global scope can only be directly nested in external modules or ambient module declarations.
 */
export {};
