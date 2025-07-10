/**
 * HTTP Utility
 * Reusable HTTP helpers with timeout and AbortController support.
 *
 * @doc refs docs/engineering-spec.md#http-utils
 */

import * as https from 'https';
import * as http from 'http';
import { RequestOptions } from '../types/geojson';

/** Sleep helper */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const DEFAULT_USER_AGENT = 'CityPee/1.0 (+https://github.com/example/citypee)';

/** Perform HTTP POST with timeout using AbortController */
export function makeRequest<T = any>(
  url: string,
  options: RequestOptions,
  timeoutMs: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    // Enable keep-alive for better performance & connection stability
    const agent = isHttps ? new https.Agent({ keepAlive: true }) : new http.Agent({ keepAlive: true });

    // Merge default headers (User-Agent & Accept) with caller-supplied headers
    const defaultHeaders: Record<string, string> = {
      'User-Agent': options.headers?.['User-Agent'] || DEFAULT_USER_AGENT,
      Accept: 'application/json'
    };

    const requestOptions = {
      ...options,
      headers: { ...defaultHeaders, ...(options.headers || {}) },
      agent,
      signal: undefined as any // will set below
    } as http.RequestOptions;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    (requestOptions as any).signal = controller.signal;

    const req = client.request(url, requestOptions, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        clearTimeout(timeoutId);
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (err: Error & { code?: string }) => {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err.code === 'ABORT_ERR' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        reject(new Error('Request timeout'));
      } else {
        reject(err);
      }
    });

    if (options.body) req.write(options.body);
    req.end();
  });
} 