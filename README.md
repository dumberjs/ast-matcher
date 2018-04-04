# ast-matcher

```
npm install ast-matcher
```

## Set Parser

Beware `ast-matcher` doesn't install a parser for you. You need to manually install one.

We support any parser compatible with [ESTree spec](https://github.com/estree/estree). Here are some popular ones:

- [acorn](https://github.com/acornjs/acorn)
- [cherow](https://github.com/cherow/cherow)
- [esprima](https://github.com/jquery/esprima/)
- [espree](https://github.com/eslint/espree)

Take `esprima` for example, you need to use `setParser` to set parser for `ast-matcher`.

```js
var esprima = require('esprima');
var astMatcher = require('ast-matcher');
astMatcher.setParser(esprima.parse);
// or pass options to esprima
astMatcher.setParser(function(contents) {
  return esprima.parse(contents, {jsx: true});
});
```