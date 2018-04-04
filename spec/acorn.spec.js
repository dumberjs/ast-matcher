'use strict';
const acorn = require('acorn');
const withParser = require('./with-parser');

withParser('acorn', acorn.parse);
