const baseConfig = require('../.eslintrc');

module.exports = {
  ...baseConfig,
  rules: {
    '@typescript-eslint/lines-between-class-members': 0,
  },
  overrides: [],
};
