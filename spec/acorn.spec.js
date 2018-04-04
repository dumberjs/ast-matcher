'use strict';
const acorn = require('acorn');
const withParser = require('./with-parser');

withParser('acorn', f => acorn.parse(f, {ranges: true, locations: true}));
