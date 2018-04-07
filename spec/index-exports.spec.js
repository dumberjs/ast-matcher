'use strict';
const test = require('tape');

const astMatcher = require('../index');

test('got exports', t => {
  t.ok(astMatcher);
  t.ok(astMatcher.setParser);
  t.ok(astMatcher.ensureParsed);
  t.ok(astMatcher.extract);
  t.ok(astMatcher.compilePattern);
  t.ok(astMatcher.depFinder);
  t.ok(astMatcher.hasOwnProperty('STOP'));
  t.ok(astMatcher.hasOwnProperty('SKIP_BRANCH'));
  t.ok(astMatcher.traverse);
  t.end();
});
