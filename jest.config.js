module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: [process.cwd() + '/test/env.js']
};
