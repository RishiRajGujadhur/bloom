module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: { '^.+\\.(mjs|[tj]sx?)$': 'babel-jest' },
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/tests/styleMock.cjs',
    '^swiper/css.*$': '<rootDir>/tests/styleMock.cjs',
    '\\.(webp|png|jpe?g|svg)$': '<rootDir>/tests/fileMock.cjs',
    '\\?worker$': '<rootDir>/tests/workerMock.cjs',
    '\\?(worker&url|url)$': '<rootDir>/tests/fileMock.cjs',
  },
  // d3-shape/d3-path ship ESM only; let Babel compile them for Jest.
  transformIgnorePatterns: ['/node_modules/(?!(d3-shape|d3-path|marked|@formkit|swiper|ssr-window|dom7)/)'],
  // Build info that Vite injects with define.
  globals: { __BUILD_TIME__: '2026-01-01T00:00:00.000Z', __COMMIT__: 'test' },
  clearMocks: true,
  // Full-App renders are slow on a cold module graph when run in-band.
  testTimeout: 30000,
}
