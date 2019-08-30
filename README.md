# ast-matcher [![Build Status](https://travis-ci.org/dumberjs/ast-matcher.svg?branch=master)](https://travis-ci.org/dumberjs/ast-matcher)

Create pattern based AST matcher function. So you don't need to be an AST master in order to do static code analysis for JavaScript.


```
npm install ast-matcher
```

This tool can be used in `Node.js` or browser. You may need some polyfill for missing JavaScript features in very old browsers.

## First, choose a parser

Beware `ast-matcher` doesn't install a parser for you. You need to manually install one.

We support any parser compatible with [ESTree spec](https://github.com/estree/estree). Here are some popular ones:

- [acorn](https://github.com/acornjs/acorn)
- [@babel/parser](https://github.com/babel/babel/tree/master/packages/babel-parser) with `estree` plugin
- [cherow](https://github.com/cherow/cherow)
- [espree](https://github.com/eslint/espree)
- [esprima](https://github.com/jquery/esprima/)

Take `esprima` for example, you need to use `setParser` to hook it up for `ast-matcher`.

```js
const esprima = require('esprima');
const astMatcher = require('ast-matcher');
// with es6, import astMatcher, { depFinder } from 'ast-matcher';

astMatcher.setParser(esprima.parse);
// or pass options to esprima
astMatcher.setParser(function(contents) {
  return esprima.parse(contents, {jsx: true});
});
```

Beware `@babel/parser` needs `estree` plugin
```js
const parser = require('@babel/parser');
const astMatcher = require('ast-matcher');

astMatcher.setParser(function(contents) {
  return parser.parse(contents, {
    // ... other options
    plugins: [
      // ... other plugins
      'estree'
    ]
  });
});
```

For TypeScript user, use:

```js
import * as astMatcher from 'ast-matcher';`
let { depFinder } = astMatcher;
```

## API doc for two main functions: `astMatcher` and `depFinder`.

### `astMatcher`

Pattern matching using AST on JavaScript source code.

```js
const matcher = astMatcher('__any.method(__str_foo, [__arr_opts])')
matcher('au.method("a", ["b", "c"]); jq.method("d", ["e"])');
// => [
//      {match: {foo: "a", opts: ["b", "c"]}, node: <CallExpression node> }
//      {match: {foo: "d", opts: ["e"]}, node: <CallExpression node> }
//    ]
```

`astMatcher` takes a `pattern` to be matched. The pattern can only be single statement, not multiple statements. Generates a function that:

* takes source code string (or estree syntax tree) as input,
* produces matched result or undefined.

Support following match terms in pattern:

* `__any`       matches any single node, but no extract
* `__anl`       matches array of nodes, but no extract
* `__str`       matches string literal, but no extract
* `__arr`       matches array of partial string literals, but no extract
* `__any_aName` matches single node, return `{aName: node}`
* `__anl_aName` matches array of nodes, return `{aName: array_of_nodes}`
* `__str_aName` matches string literal, return `{aName: value}`
* `__arr_aName` matches array, extract string literals, return `{aName: [values]}`

> `__arr`, and `__arr_aName` can match partial string array. `[foo, "foo", "bar", lorem] => ["foo", "bar"]`

> use `method(__anl)` or `method(__arr_a)` to match `method(a, "b");`

> use `method([__anl])` or `method([__arr_a])` to match `method([a, "b"]);`

### `depFinder`

Dependency analysis for dummies, this is a high level api to simplify the usage of `astMatcher`.

```js
const depFinder = astMatcher.depFinder;
const finder = depFinder('a(__dep)', '__any.globalResources([__deps])');
finder('a("a"); a("b"); config.globalResources(["./c", "./d"])');
// => ['a', 'b', './c', './d']
```

`depFinder` takes multiple patterns to match, instead of using `__str_`/`__arr`, use `__dep` and `__deps` to match string and partial string array. Generates a function that:

* takes source code string (or estree syntax tree) as input,
* produces an array of string matched, or empty array.

## Examples

#### 1. find AMD dependencies

Beware AMD module could be wrapped commonjs module, you need to remove `['require', 'exports', 'module']` from the result.

```js
const amdFind = depFinder(
  'define([__deps], __any)', // anonymous module
  'define(__str, [__deps], __any)' // named module
);
const deps = amdFind(amdJsFileContent_or_parsed_ast_tree);
```

#### 2. find CommonJS dependencies

```js
const cjsFind = depFinder('require(__dep)');
const deps = cjsFind(cjsJsFileContent_or_parsed_ast_tree);
```

#### 3. match `if` statement

```js
const matcher = astMatcher('if ( __any_condition ) { __anl_body }');
const m = matcher(code_or_parsed_ast_tree);
// => [
//   {
//     match: { condition: a_node, body: array_of_nodes },
//     node: if_statement_node
//   },
//   ...
// ]
```

#### 4. match `if-else` statement

```js
const matcher = astMatcher('if ( __any_condition ) { __anl_ifBody } else { __anl_elseBody }');
const m = matcher(code_or_parsed_ast_tree);
// => [
//   {
//     match: { condition: a_node, ifBody: array_of_nodes, elseBody: array_of_nodes },
//     node: if_else_statement_node
//   },
//   ...
// ]
```

#### 5. find [`Aurelia`](http://aurelia.io) framework's `PLATFORM.moduleName()` dependencies

```js
const auJsDepFinder = depFinder(
  'PLATFORM.moduleName(__dep)',
  '__any.PLATFORM.moduleName(__dep)',
  'PLATFORM.moduleName(__dep, __any)',
  '__any.PLATFORM.moduleName(__dep, __any)'
);
const deps = auJsDepFinder(auCode_or_parsed_ast_tree);
```
