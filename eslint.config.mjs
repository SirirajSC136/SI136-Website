import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
	...nextCoreWebVitals,
	...nextTypeScript,
	{
		ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
	},
	{
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unsafe-function-type": "off",
			"react-hooks/set-state-in-effect": "off",
			"@next/next/no-html-link-for-pages": "off",
			"@next/next/inline-script-id": "off",
			"@typescript-eslint/no-require-imports": "off",
		},
	},
];

export default eslintConfig;
