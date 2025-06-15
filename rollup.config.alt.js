const typescript = require('@rollup/plugin-typescript');

module.exports = [
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.build.json',
        noForceEmit: true,
        exclude: ['**/*.test.ts', '**/*.spec.ts', 'src/examples/**/*']
      })
    ],
    external: ['reflect-metadata']
  },
  // ES Modules build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.build.json',
        noForceEmit: true,
        exclude: ['**/*.test.ts', '**/*.spec.ts', 'src/examples/**/*']
      })
    ],
    external: ['reflect-metadata']
  }
];
