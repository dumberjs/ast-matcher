'use strict';
const espree = require('espree');
const withParser = require('./with-parser');

withParser('espree', espree.parse);
