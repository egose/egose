// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, eslintConfigPrettier, {
  rules: {
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/lines-between-class-members': 0,
    '@typescript-eslint/naming-convention': 0,
    '@typescript-eslint/no-empty-object-type': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-require-imports': 0,
    '@typescript-eslint/no-shadow': 0,
    '@typescript-eslint/no-this-alias': 0,
    '@typescript-eslint/no-unsafe-function-type': 0,
    '@typescript-eslint/no-unused-expressions': 0,
    '@typescript-eslint/no-unused-vars': 0,
    '@typescript-eslint/no-use-before-define': 0,
    'import/no-extraneous-dependencies': 0,
    'no-await-in-loop': 0,
    'no-continue': 0,
    'no-empty': 0,
    'no-empty-pattern': 0,
    'no-extra-boolean-cast': 0,
    'no-fallthrough': 0,
    'no-loss-of-precision': 0,
    'no-nested-ternary': 0,
    'no-path-concat': 0,
    'no-plusplus': 0,
    'no-prototype-builtins': 0,
    'no-setter-return': 0,
    'no-undef': 0,
    'no-unneeded-ternary': 0,
    'prefer-arrow-callback': 0,
    'prefer-const': 0,
    'prefer-destructuring': 0,
    'prefer-template': 0,
    'require-yield': 0,
  },
});
