#!/bin/bash
set -e

node="yarn --silent node"
jestArgs="--coverage"

if [ -n "$CI" ]; then
  jestArgs="${jestArgs} --maxWorkers=4 --ci"
fi

if [ -n "$TEST_FILTER" ]; then
  jestArgs="${jestArgs} ${TEST_FILTER}"
fi

$node node_modules/.bin/jest $jestArgs
