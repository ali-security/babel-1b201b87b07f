import wrapRegExp from "../../helpers/wrapRegExp.js";
import wrapRegExpCorejs2 from "../../../babel-runtime-corejs2/helpers/wrapRegExp.js";

describe("wrapRegExp", () => {
  describe("should handle maliciously crafted substitutions", () => {
    it("$<$<...$<group", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExp(pattern, groups);
      const targetStr = "foofoo";
      const replacement = "$<".repeat(1e5) + "group";
      const startTime = Date.now();
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      // This test will fail if 2000ms is passed
      const timeTaken = Date.now() - startTime;
      expect(timeTaken).toBeLessThan(2000);
      expect(result).toBe(replacement + "foo");
    });

    it("$<$<...$<group>", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExp(pattern, groups);
      const targetStr = "foofoo";
      const replacement = "$<".repeat(1e5) + "group>";
      const startTime = Date.now();
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      // This test will fail if 2000ms is passed
      const timeTaken = Date.now() - startTime;
      expect(timeTaken).toBeLessThan(2000);
      expect(result).toBe("foo");
    });

    it("$<g$<g...$<group", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExp(pattern, groups);
      const targetStr = "foofoo";
      const replacement = "$<g".repeat(1e5) + "group";
      const startTime = Date.now();
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      // This test will fail if 2000ms is passed
      const timeTaken = Date.now() - startTime;
      expect(timeTaken).toBeLessThan(2000);
      expect(result).toBe(replacement + "foo");
    });

    it("$<g$<g...$<group>", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExp(pattern, groups);
      const targetStr = "foofoo";
      const replacement = "$<g".repeat(1e5) + "group>";
      const startTime = Date.now();
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      // This test will fail when 2000ms is passed
      const timeTaken = Date.now() - startTime;
      expect(timeTaken).toBeLessThan(2000);
      expect(result).toBe("foo");
    });

    it("$<_$>", () => {
      const pattern = "(foo)";
      const groups = { _$: 1 };
      const myRegExp = wrapRegExp(pattern, groups);
      const targetStr = "foobar";
      const replacement = "$<_$>$<_$>";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe("foofoobar");
    });

    it("$<hasOwnProperty>", () => {
      const pattern = "(foo)";
      const groups = { hasOwnProperty: 1 };
      const myRegExp = wrapRegExp(pattern, groups);
      const targetStr = "foobar";
      const replacement = "$<hasOwnProperty>";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe("foobar");
    });

    it("$<__proto__>", () => {
      const pattern = "(foo)";
      const groups = { ["__proto__"]: 1 };
      const myRegExp = wrapRegExp(pattern, groups);
      const targetStr = "foobar";
      const replacement = "$<__proto__>";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe("foobar");
    });
  });
  describe("substitutions", () => {
    it("unknown group", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExp(pattern, groups);
      const targetStr = "foobar";
      const replacement = "$<UNKNOWN>";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe("bar");
    });

    it("$<hasOwnProperty> - unknown group", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExp(pattern, groups);
      const targetStr = "foobar";
      const replacement = "$<hasOwnProperty>";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe("bar");
    });

    it("$<__proto__> -- unknown group", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExp(pattern, groups);
      const targetStr = "foobar";
      const replacement = "$<__proto__>";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe("bar");
    });
  });
});

// The unterminated "$<" cases above time the full replace on a matching
// target, which also includes the engine's own handling of the "$<" sequences
// that the helper passes through. The variants below time only the helper's
// substitution parsing, by replacing against a target the RegExp never matches.
describe.each([
  ["@babel/runtime", wrapRegExp],
  ["@babel/runtime-corejs2", wrapRegExpCorejs2],
])("wrapRegExp substitution parsing (%s)", (_, wrapRegExpHelper) => {
  it("$<$<...$<group (non-matching target)", () => {
    const pattern = "(foo)";
    const groups = { group: 1 };
    const myRegExp = wrapRegExpHelper(pattern, groups);
    const targetStr = "barbar";
    const replacement = "$<".repeat(1e5) + "group";
    const startTime = Date.now();
    const result = myRegExp[Symbol.replace](targetStr, replacement);
    // This test will fail if 2000ms is passed
    const timeTaken = Date.now() - startTime;
    expect(timeTaken).toBeLessThan(2000);
    expect(result).toBe("barbar");
  });

  it("$<g$<g...$<group (non-matching target)", () => {
    const pattern = "(foo)";
    const groups = { group: 1 };
    const myRegExp = wrapRegExpHelper(pattern, groups);
    const targetStr = "barbar";
    const replacement = "$<g".repeat(1e5) + "group";
    const startTime = Date.now();
    const result = myRegExp[Symbol.replace](targetStr, replacement);
    // This test will fail if 2000ms is passed
    const timeTaken = Date.now() - startTime;
    expect(timeTaken).toBeLessThan(2000);
    expect(result).toBe("barbar");
  });
});

// The same cases, run against the @babel/runtime-corejs2 build of the helper.
describe("wrapRegExp (@babel/runtime-corejs2)", () => {
  describe("should handle maliciously crafted substitutions", () => {
    it("$<$<...$<group (unterminated group is kept as-is)", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExpCorejs2(pattern, groups);
      const targetStr = "foofoo";
      const replacement = "$<".repeat(1e5) + "group";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe(replacement + "foo");
    });

    it("$<$<...$<group>", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExpCorejs2(pattern, groups);
      const targetStr = "foofoo";
      const replacement = "$<".repeat(1e5) + "group>";
      const startTime = Date.now();
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      // This test will fail if 2000ms is passed
      const timeTaken = Date.now() - startTime;
      expect(timeTaken).toBeLessThan(2000);
      expect(result).toBe("foo");
    });

    it("$<g$<g...$<group (unterminated group is kept as-is)", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExpCorejs2(pattern, groups);
      const targetStr = "foofoo";
      const replacement = "$<g".repeat(1e5) + "group";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe(replacement + "foo");
    });

    it("$<g$<g...$<group>", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExpCorejs2(pattern, groups);
      const targetStr = "foofoo";
      const replacement = "$<g".repeat(1e5) + "group>";
      const startTime = Date.now();
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      // This test will fail when 2000ms is passed
      const timeTaken = Date.now() - startTime;
      expect(timeTaken).toBeLessThan(2000);
      expect(result).toBe("foo");
    });

    it("$<_$>", () => {
      const pattern = "(foo)";
      const groups = { _$: 1 };
      const myRegExp = wrapRegExpCorejs2(pattern, groups);
      const targetStr = "foobar";
      const replacement = "$<_$>$<_$>";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe("foofoobar");
    });

    it("$<hasOwnProperty>", () => {
      const pattern = "(foo)";
      const groups = { hasOwnProperty: 1 };
      const myRegExp = wrapRegExpCorejs2(pattern, groups);
      const targetStr = "foobar";
      const replacement = "$<hasOwnProperty>";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe("foobar");
    });

    it("$<__proto__>", () => {
      const pattern = "(foo)";
      const groups = { ["__proto__"]: 1 };
      const myRegExp = wrapRegExpCorejs2(pattern, groups);
      const targetStr = "foobar";
      const replacement = "$<__proto__>";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe("foobar");
    });
  });
  describe("substitutions", () => {
    it("unknown group", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExpCorejs2(pattern, groups);
      const targetStr = "foobar";
      const replacement = "$<UNKNOWN>";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe("bar");
    });

    it("$<hasOwnProperty> - unknown group", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExpCorejs2(pattern, groups);
      const targetStr = "foobar";
      const replacement = "$<hasOwnProperty>";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe("bar");
    });

    it("$<__proto__> -- unknown group", () => {
      const pattern = "(foo)";
      const groups = { group: 1 };
      const myRegExp = wrapRegExpCorejs2(pattern, groups);
      const targetStr = "foobar";
      const replacement = "$<__proto__>";
      const result = myRegExp[Symbol.replace](targetStr, replacement);
      expect(result).toBe("bar");
    });
  });
});

// Diagnostic only: the unterminated "$<" cases leave every "$<" in the
// substitution for the engine, which (when the match has named groups) scans
// ahead for a closing ">" at each one. This times that native-only work, with
// no Babel helper involved, next to the helper's own timings, and logs them.
describe("native $< rescan diagnostic", () => {
  function report(label, value) {
    const env = process.version + " " + process.platform;
    console.log("[wrapRegExp-diag] " + label, value, env);
  }

  function timeReplacements(name, replacement) {
    let nativeRegExp;
    try {
      nativeRegExp = new RegExp("(?<group>foo)");
    } catch (e) {
      // Named groups are not supported (Node 6 and 8).
      report("native " + name, "skipped");
      return;
    }

    let startTime = Date.now();
    const nativeResult = "foofoo".replace(nativeRegExp, replacement);
    report("native " + name + " ms", Date.now() - startTime);

    const myRegExp = wrapRegExp("(foo)", { group: 1 });
    startTime = Date.now();
    myRegExp[Symbol.replace]("barbar", replacement);
    report("helper barbar " + name + " ms", Date.now() - startTime);

    startTime = Date.now();
    myRegExp[Symbol.replace]("foofoo", replacement);
    report("helper foofoo " + name + " ms", Date.now() - startTime);

    expect(nativeResult).toBe(replacement + "foo");
  }

  it("$<$<...$<group", () => {
    timeReplacements("$<$<...$<group", "$<".repeat(1e5) + "group");
  });

  it("$<g$<g...$<group", () => {
    timeReplacements("$<g$<g...$<group", "$<g".repeat(1e5) + "group");
  });
});
