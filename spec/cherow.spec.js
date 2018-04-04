'use strict';

if (!process.version.startsWith('v4')) {
  const cherow = require('cherow');
  const withParser = require('./with-parser');
  withParser('cherow', cherow.parseScript);
}
