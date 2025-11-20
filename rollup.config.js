import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

const production = !process.env.ROLLUP_WATCH;

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "umd",
        name: "Aizu",
        sourcemap: true,
        exports: "named",
      },
      {
        file: "dist/index.esm.js",
        format: "es",
        sourcemap: true,
        exports: "named",
      },
      {
        file: "dist/index.cjs",
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
      {
        file: "dist/index.min.js",
        format: "umd",
        name: "Aizu",
        sourcemap: true,
        exports: "named",
        plugins: [
          terser({
            compress: {
              drop_console: production,
              drop_debugger: production,
              pure_funcs: production ? ["console.log", "console.warn"] : [],
            },
            mangle: {
              properties: {
                regex: /^_/,
              },
            },
          }),
        ],
      },
      {
        file: "dist/aizu.cdn.js",
        format: "iife",
        name: "Aizu",
        sourcemap: false,
        exports: "named",
        plugins: [
          terser({
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ["console.log", "console.warn", "console.info"],
              passes: 3,
              unsafe: true,
              unsafe_comps: true,
              unsafe_Function: true,
              unsafe_math: true,
              unsafe_symbols: true,
              unsafe_methods: true,
              unsafe_proto: true,
              unsafe_regexp: true,
              unsafe_undefined: true,
            },
            mangle: {
              properties: {
                regex: /^_/,
              },
              toplevel: true,
            },
            format: {
              comments: false,
            },
          }),
        ],
      },
    ],
    external: [],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
        exportConditions: ["browser", "module", "import", "default"],
      }),
      commonjs({
        transformMixedEsModules: true,
      }),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        sourceMap: true,
        compilerOptions: {
          declarationMap: false,
          target: "ES2020",
        },
      }),
      production &&
        terser({
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        }),
    ],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false,
    },
  },
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.d.ts",
        format: "es",
        banner: "// Type definitions for Aizu Analytics SDK",
      },
    ],
    plugins: [
      dts({
        respectExternal: true,
      }),
    ],
  },
];
