'use strict';

describe('Server', () => {
  test('server.js can be required without throwing', () => {
    expect(() => {
      require('../server.js');
    }).not.toThrow();
  });

  test('server exports are available', () => {
    const server = require('../server.js');
    expect(server).toBeTruthy();
  });
});