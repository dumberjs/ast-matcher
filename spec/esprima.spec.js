'use strict';
const esprima = require('esprima');
const withParser = require('./with-parser');

withParser('esprima', esprima.parse);
