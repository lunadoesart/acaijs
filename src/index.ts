import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

/**
 * Interface for request options
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  timeout?: number;
  body?: string | Record<string, any> | Buffer;
}

/**
 * Interface for response data
 */
export interface ResponseData {
  status: number;
  headers: http.IncomingHttpHeaders;
  data: any;
  raw: Buffer;
}

/**
 * Main WebObject class - A native Common API Interface
 * A blazingly fast Common API Interface for Node.js using native libraries
 */
export class WebObject {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  /**
   * Create a new WebObject instance
   * @param baseUrl Base URL for the API
   * @param defaultHeaders Default headers to include in every request
   */
  constructor(baseUrl?: string, defaultHeaders?: Record<string, string>) {
    this.baseUrl = baseUrl || '';
    this.defaultHeaders = defaultHeaders || {};
  }

  /**
   * Send a request using native http/https modules
   * @param url The URL to send the request to
   * @param options Request options
   * @returns Promise with the response data
   */
  async request(url: string, options: RequestOptions = {}): Promise<ResponseData> {
    // Combine base URL with provided URL if base URL exists
    const fullUrl = this.baseUrl ? new URL(url, this.baseUrl) : new URL(url);
    const isHttps = fullUrl.protocol === 'https:';
    
    // Prepare request options
    const requestOptions: http.RequestOptions = {
      method: options.method || 'GET',
      headers: { ...this.defaultHeaders, ...options.headers },
      timeout: options.timeout,
      protocol: fullUrl.protocol,
      hostname: fullUrl.hostname,
      port: fullUrl.port,
      path: `${fullUrl.pathname}${fullUrl.search}`
    };

    // Add content-type for JSON if sending data and not specified
    if (options.body && typeof options.body === 'object' && !Buffer.isBuffer(options.body) && 
        !requestOptions.headers?.['content-type']) {
      requestOptions.headers = { 
        'content-type': 'application/json',
        ...(requestOptions.headers || {})
      };
    }

    return new Promise((resolve, reject) => {
      // Choose http or https based on protocol
      const requestFn = isHttps ? https.request : http.request;
      
      const req = requestFn(requestOptions, (res) => {
        const chunks: Buffer[] = [];
        
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        
        res.on('end', () => {
          const rawData = Buffer.concat(chunks);
          let parsedData: any = rawData;
          
          try {
            // Try to parse as JSON if content type indicates JSON
            const contentType = res.headers['content-type'];
            if (contentType && contentType.includes('application/json')) {
              parsedData = JSON.parse(rawData.toString());
            } else {
              // Default to string if not JSON
              parsedData = rawData.toString();
            }
          } catch (error) {
            // If parsing fails, use the raw string data
            parsedData = rawData.toString();
          }
          
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            data: parsedData,
            raw: rawData
          });
        });
      });
      
      // Handle request errors
      req.on('error', (err) => {
        reject(err);
      });
      
      // Handle timeout
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${options.timeout}ms`));
      });
      
      // Send request body if present
      if (options.body) {
        if (Buffer.isBuffer(options.body)) {
          req.write(options.body);
        } else if (typeof options.body === 'string') {
          req.write(options.body);
        } else {
          // Assume JSON object
          req.write(JSON.stringify(options.body));
        }
      }
      
      req.end();
    });
  }

  /**
   * HTTP GET request
   * @param url The URL to send the request to
   * @param options Request options
   */
  async get(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ResponseData> {
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * HTTP POST request
   * @param url The URL to send the request to
   * @param body The body of the request
   * @param options Request options
   */
  async post(url: string, body?: RequestOptions['body'], options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ResponseData> {
    return this.request(url, { ...options, body, method: 'POST' });
  }

  /**
   * HTTP PUT request
   * @param url The URL to send the request to
   * @param body The body of the request
   * @param options Request options
   */
  async put(url: string, body?: RequestOptions['body'], options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ResponseData> {
    return this.request(url, { ...options, body, method: 'PUT' });
  }

  /**
   * HTTP DELETE request
   * @param url The URL to send the request to
   * @param options Request options
   */
  async delete(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ResponseData> {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  /**
   * HTTP PATCH request
   * @param url The URL to send the request to
   * @param body The body of the request
   * @param options Request options
   */
  async patch(url: string, body?: RequestOptions['body'], options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ResponseData> {
    return this.request(url, { ...options, body, method: 'PATCH' });
  }

  /**
   * Set base URL for all requests
   * @param url The base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Set default headers for all requests
   * @param headers The default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }
}

// Export everything from this file as the main module entry point
export default WebObject;
