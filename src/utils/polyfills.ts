if (!("empty" in String)) {
  Object.defineProperty(String, "empty", {
    value: "",
    writable: false,
    configurable: false,
  });
}
