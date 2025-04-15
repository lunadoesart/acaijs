import { WebObject } from '../src/index.js';
import type { RequestOptions, ResponseData } from '../src/index.js';
import * as http from 'http';
import * as https from 'https';
import { Server } from 'http';
import type { AddressInfo } from 'net';

// Mock server for testing
describe('WebObject Tests', () => {
  let server: Server;
  let baseUrl: string;

  // Setup test server before tests run
  beforeAll((done) => {
    server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      let data = '';
      
      req.on('data', (chunk) => {
        data += chunk;
      });

      req.on('end', () => {
        // Route handling
        if (url.pathname === '/echo') {
          const contentType = req.headers['content-type'] || 'text/plain';
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data || 'Echo endpoint');
        } 
        else if (url.pathname === '/json') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'JSON response', method: req.method, received: data ? JSON.parse(data) : null }));
        } 
        else if (url.pathname === '/headers') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ headers: req.headers }));
        } 
        else if (url.pathname === '/status') {
          const statusCode = parseInt(url.searchParams.get('code') || '200');
          res.writeHead(statusCode);
          res.end(`Status code: ${statusCode}`);
        } 
        else if (url.pathname === '/timeout') {
          // Don't respond, let it timeout
        } 
        else {
          res.writeHead(404);
          res.end('Not found');
        }
      });
    });

    server.listen(0, () => { // Let OS assign random port
      const address = server.address() as AddressInfo;
      baseUrl = `http://localhost:${address.port}`;
      done();
    });
  });

  // Teardown test server after tests
  afterAll((done) => {
    server.close(done);
  });

  test('GET request should return correct response', async () => {
    const client = new WebObject();
    const response = await client.get(`${baseUrl}/json`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message', 'JSON response');
    expect(response.data).toHaveProperty('method', 'GET');
  });

  test('POST request should send and return data correctly', async () => {
    const client = new WebObject();
    const testData = { name: 'Test', value: 123 };
    
    const response = await client.post(`${baseUrl}/json`, testData);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('method', 'POST');
    expect(response.data.received).toEqual(testData);
  });

  test('Custom headers should be sent correctly', async () => {
    const client = new WebObject();
    const customHeaders = {
      'x-test-header': 'test-value',
      'x-another-header': 'another-value'
    };
    
    const response = await client.get(`${baseUrl}/headers`, {
      headers: customHeaders
    });
    
    expect(response.status).toBe(200);
    expect(response.data.headers).toHaveProperty('x-test-header', 'test-value');
    expect(response.data.headers).toHaveProperty('x-another-header', 'another-value');
  });

  test('Default headers should be included in requests', async () => {
    const defaultHeaders = {
      'x-default-header': 'default-value',
      'user-agent': 'WebObject-Test'
    };
    
    const client = new WebObject(undefined, defaultHeaders);
    const response = await client.get(`${baseUrl}/headers`);
    
    expect(response.status).toBe(200);
    expect(response.data.headers).toHaveProperty('x-default-header', 'default-value');
    expect(response.data.headers).toHaveProperty('user-agent', 'WebObject-Test');
  });

  test('Base URL should be used correctly', async () => {
    const client = new WebObject(baseUrl);
    const response = await client.get('/json');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message', 'JSON response');
  });

  test('Different HTTP methods should work correctly', async () => {
    const client = new WebObject();
    const testData = { test: 'data' };
    
    const putResponse = await client.put(`${baseUrl}/json`, testData);
    expect(putResponse.status).toBe(200);
    expect(putResponse.data).toHaveProperty('method', 'PUT');
    
    const deleteResponse = await client.delete(`${baseUrl}/json`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.data).toHaveProperty('method', 'DELETE');
    
    const patchResponse = await client.patch(`${baseUrl}/json`, testData);
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.data).toHaveProperty('method', 'PATCH');
  });

  test('Error status codes should be handled correctly', async () => {
    const client = new WebObject();
    const response = await client.get(`${baseUrl}/status?code=404`);
    
    expect(response.status).toBe(404);
  });

  test('Request timeout should throw error', async () => {
    const client = new WebObject();
    
    await expect(
      client.get(`${baseUrl}/timeout`, { timeout: 100 })
    ).rejects.toThrow('Request timeout after 100ms');
  });
});
