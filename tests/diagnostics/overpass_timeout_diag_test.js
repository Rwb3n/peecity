const http = require('http');
const { queryOverpass } = require('../../src/utils/overpass.ts');

describe('Overpass Utility – Timeout diagnostic', () => {
  let server;
  let port;

  beforeAll(done => {
    // Start slow test server
    server = http.createServer((req, res) => {
      // Delay longer than client timeout to force timeout scenario
      setTimeout(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{}');
      }, 150); // 150 ms
    });
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll(done => {
    server.close(done);
  });

  it('should throw a timeout error within configured limit', async () => {
    const url = `http://localhost:${port}`;

    // We expect the promise to reject with timeout, but current implementation does not trigger
    await expect(
      queryOverpass('out:json;', {
        apiUrl: url,
        timeoutMs: 50, // 50 ms timeout shorter than server delay
        retryAttempts: 1,
        enableCache: false
      })
    ).rejects.toThrow('timeout');
  });
}); 