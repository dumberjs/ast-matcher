'use strict';
const { parseSync } = require('oxc-parser');
const withParser = require('./with-parser');

withParser('oxc-parser', code => JSON.parse(parseSync(code).program));
