import js from "@eslint/js";
import css from "@eslint/css";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";

export default defineConfig([
	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
		plugins: { js, stylistic },
		extends: ["js/recommended"],
		languageOptions: { globals: globals.browser },
		rules: {
			"stylistic/quotes": ["error", "double", { "avoidEscape": true }],
			"stylistic/semi": ["error", "always", { "omitLastInOneLineBlock": true }],
			"stylistic/comma-dangle": ["error", "never"]
		}
	},
	tseslint.configs.recommended,
	{
		files: ["**/*.{ts,mts,cts,vue}"],
		languageOptions: { parserOptions: { parser: tseslint.parser } },
		rules: {
			"no-undef": "off",
			"@typescript-eslint/no-unused-vars": "off"
		}
	},
	pluginVue.configs["flat/essential"].map(config => ({
		...config,
		files: ["**/*.vue"]
	})),
	{
		files: ["**/*.vue"],
		languageOptions: { parserOptions: { parser: tseslint.parser } },
		rules: {
			"vue/block-lang": ["error", { "script": { "lang": "ts" } }],
			"vue/multi-word-component-names": "off"
		}
	},
	{ files: ["**/*.css"], plugins: { css }, language: "css/css", extends: ["css/recommended"] }
]);