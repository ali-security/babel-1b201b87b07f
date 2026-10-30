"use strict";

// Prints every skipped test with the reason it is skipped, so CI logs carry
// more than Jest's bare "N skipped" count. Plain functions and const only:
// the Node 6 leg loads it untranspiled.

const fs = require("fs");
const path = require("path");

function reasonFor(file, test) {
  const rel = file.split(path.sep).join("/");
  const name = test.fullName || test.title;

  if (/packages\/babel-core\/test\/async\.js$/.test(rel)) {
    return (
      "async test gated by nodeGte8 (needs Node >= 8, this is " +
      process.version +
      ")"
    );
  }
  if (/packages\/babel-standalone\/test\/babel\.js$/.test(rel)) {
    return (
      "@babel/standalone smoke tests are describe.skip'd when TEST_TYPE=cov " +
      "(standalone bundle is not built in coverage mode)"
    );
  }
  if (/packages\/babel-traverse\/test\/traverse\.js$/.test(rel)) {
    return "upstream it.skip: requeue after skip is unsupported, see NodePath.requeue";
  }
  if (
    /eslint\/babel-eslint-tests\/test\/integration\/eslint\/eslint\.js$/.test(
      rel
    )
  ) {
    return "upstream it.skip: known ESLint scope issue with excluded properties left of spread (#249)";
  }
  return (
    "fixture '" +
    name +
    "' lives in a dot-prefixed directory " +
    "(disabled upstream; helper-fixtures marks it task.disabled -> it.skip)"
  );
}

function SkippedReporter() {}

function categoryFor(reason) {
  return /^fixture '/.test(reason)
    ? "fixture lives in a dot-prefixed directory (disabled upstream)"
    : reason;
}

function isSkipped(test) {
  return (
    test.status === "pending" ||
    test.status === "skipped" ||
    test.status === "todo"
  );
}

SkippedReporter.prototype.onRunComplete = function(contexts, results) {
  const lines = [];
  const suites = [];
  const counts = {};
  results.testResults.forEach(function(file) {
    const rel = path.relative(process.cwd(), file.testFilePath);
    const tests = file.testResults || [];
    const skipped = tests.filter(isSkipped);
    skipped.forEach(function(test) {
      const reason = reasonFor(file.testFilePath, test);
      const category = categoryFor(reason);
      counts[category] = (counts[category] || 0) + 1;
      lines.push(
        "  SKIPPED " +
          rel +
          " > " +
          (test.fullName || test.title) +
          "\n      reason: " +
          reason
      );
    });
    if (skipped.length && skipped.length === tests.length) {
      suites.push(
        "  SKIPPED SUITE " +
          rel +
          " (all " +
          skipped.length +
          " tests)" +
          "\n      reason: " +
          reasonFor(file.testFilePath, {})
      );
    }
  });
  const summary = Object.keys(counts).map(function(category) {
    return "  " + counts[category] + " x " + category;
  });
  const report =
    "\n=== Skipped tests (" +
    lines.length +
    ") ===\n" +
    (lines.length ? lines.join("\n") + "\n" : "  none\n") +
    "=== Wholly skipped test suites (" +
    suites.length +
    ") ===\n" +
    (suites.length ? suites.join("\n") + "\n" : "  none\n") +
    "=== Skipped tests by reason (" +
    lines.length +
    " total) ===\n" +
    (summary.length ? summary.join("\n") + "\n" : "  none\n") +
    "=== End of skipped tests ===\n";
  process.stdout.write(report);
  // Also saved to a file so a CI step can reprint it after later output
  // (the codecov upload) that would otherwise bury it.
  fs.writeFileSync(path.join(process.cwd(), "jest-skipped.txt"), report);
};

module.exports = SkippedReporter;
