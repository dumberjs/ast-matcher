'use strict';

if (!process.version.startsWith('v4')) {
  const cherow = require('cherow');
  const withParser = require('./with-parser');
  withParser('cherow', code => cherow.parse(code, {module: true, next: true, experimental: true}));
}
