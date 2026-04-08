export default [
  {
    files: ["adapters/fusion/**/*.cps"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script"
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error"
    },
    rules: {
      "curly": ["error", "all"],
      "dot-notation": "error",
      "no-dupe-args": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty-character-class": "error",
      "no-fallthrough": "error",
      "no-func-assign": "error",
      "no-import-assign": "error",
      "no-loss-of-precision": "error",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unused-labels": "error",
      "no-useless-catch": "error",
      "valid-typeof": "error"
    }
  }
];
