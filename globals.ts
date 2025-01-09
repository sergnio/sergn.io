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

console.log(typeof String.empty); // string

export {};
