import UmdImporter from '../main';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UmdImporter', () => {
  let importer: UmdImporter;
  let mockGet: jest.Mock;

  beforeEach(() => {
    mockGet = jest.fn();
    mockedAxios.create.mockReturnValue({
      get: mockGet,
    } as any);
    
    importer = new UmdImporter({
      debug: true,
      cache: true,
    });
    jest.clearAllMocks();
  });

  describe('import', () => {
    it('should load and execute a UMD module', async () => {
      // Mock a simple UMD module
      const mockModule = `
        (function (global, factory) {
          if (typeof define === 'function' && define.amd) {
            define(['exports'], factory);
          } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
            factory(exports);
          } else {
            factory((global.testModule = {}));
          }
        })(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function (exports) {
          exports.test = 'Hello World';
        });
      `;

      mockGet.mockResolvedValue({ data: mockModule });

      const result = await importer.import<any>('https://example.com/test.js');
      expect(result.test).toBe('Hello World');
      expect(mockGet).toHaveBeenCalledWith('https://example.com/test.js');
    });

    it('should use cache when enabled', async () => {
      const mockModule = `
        (function (global, factory) {
          factory((global.testModule = {}));
        })(this, function (exports) {
          exports.test = 'Hello World';
        });
      `;

      mockGet.mockResolvedValue({ data: mockModule });

      // First import
      await importer.import<any>('https://example.com/test.js');
      
      // Second import should use cache
      await importer.import<any>('https://example.com/test.js');
      
      // Axios should only be called once
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should handle external dependencies', async () => {
      const externalDep = { value: 'external' };
      importer = new UmdImporter({
        debug: true,
        cache: true,
        external: {
          'external-dep': externalDep,
        },
      });

      const mockModule = `
        (function (global, factory) {
          if (typeof define === 'function' && define.amd) {
            define(['exports', 'external-dep'], factory);
          } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
            factory(exports, require('external-dep'));
          } else {
            factory((global.testModule = {}), require('external-dep'));
          }
        })(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function (exports, dep) {
          exports.test = dep.value;
        });
      `;

      mockGet.mockResolvedValue({ data: mockModule });

      const result = await importer.import<any>('https://example.com/test.js');
      expect(result.test).toBe('external');
      expect(mockGet).toHaveBeenCalledWith('https://example.com/test.js');
    });
  });
}); 