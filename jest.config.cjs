module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: { '^.+\\.[tj]sx?$': 'babel-jest' },
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/tests/styleMock.cjs',
    '\\.(webp|png|jpe?g|svg)$': '<rootDir>/tests/fileMock.cjs',
    '\\?worker$': '<rootDir>/tests/workerMock.cjs',
  },
  // d3-shape/d3-path ship ESM only; let Babel compile them for Jest.
  transformIgnorePatterns: ['/node_modules/(?!(d3-shape|d3-path|marked)/)'],
  clearMocks: true,
  // Full-App renders are slow on a cold module graph when run in-band.
  testTimeout: 15000,
}
