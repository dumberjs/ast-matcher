const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    rules: {
      "no-prototype-builtins": "off"
    },
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
