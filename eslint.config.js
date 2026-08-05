import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'supabase/.temp/**',
      'tsc_output.txt',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'no-debugger': 'error',
      'no-constant-condition': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    ...js.configs.recommended,
    files: ['eslint.config.js'],
  },
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: [
      'lib/checkoutApi.ts',
      'lib/purchaseTracking.ts',
      'supabase/functions/_shared/**/*.ts',
      'supabase/functions/checkout-order/**/*.ts',
      'supabase/functions/mercadopago-webhook/**/*.ts',
      'supabase/functions/order-confirmation/**/*.ts',
      'tests/**/*.ts',
    ],
  })),
  {
    files: [
      'supabase/functions/_shared/**/*.ts',
      'supabase/functions/checkout-order/**/*.ts',
      'supabase/functions/mercadopago-webhook/**/*.ts',
      'supabase/functions/order-confirmation/**/*.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        Deno: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
