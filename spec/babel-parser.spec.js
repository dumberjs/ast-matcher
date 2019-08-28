'use strict';
const parser = require('@babel/parser');
const withParser = require('./with-parser');

withParser('@babel/parser', code => {
  const file = parser.parse(code, {sourceType: 'module', plugins: [
    'jsx',
    'typescript',
    'asyncGenerators',
    'bigInt',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'decorators-legacy',
    // ['decorators', {'decoratorsBeforeExport': true}],
    'doExpressions',
    'dynamicImport',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'functionBind',
    'functionSent',
    'importMeta',
    'logicalAssignment',
    'nullishCoalescingOperator',
    'numericSeparator',
    'objectRestSpread',
    'optionalCatchBinding',
    'optionalChaining',
    'partialApplication',
    // ['pipelineOperator', {proposal: 'minimal'}],
    'throwExpressions',
    'estree'
  ]});
  return file && file.program;
});
