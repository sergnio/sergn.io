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

// Don't think this is needed
// export {}
