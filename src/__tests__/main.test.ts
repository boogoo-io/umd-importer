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

  describe('sandbox', () => {
    it('should shadow window and document as undefined', async () => {
      const mockModule = `
        (function (global, factory) {
          if (typeof exports === 'object') {
            factory(exports);
          } else {
            factory((global.testModule = {}));
          }
        })(this, function (exports) {
          exports.hasWindow = typeof window !== 'undefined';
          exports.hasDocument = typeof document !== 'undefined';
          exports.hasFetch = typeof fetch !== 'undefined';
          exports.hasLocalStorage = typeof localStorage !== 'undefined';
        });
      `;

      mockGet.mockResolvedValue({ data: mockModule });
      const result = await importer.import<any>('https://example.com/sandbox.js');

      expect(result.hasWindow).toBe(false);
      expect(result.hasDocument).toBe(false);
      expect(result.hasFetch).toBe(false);
      expect(result.hasLocalStorage).toBe(false);
    });
  });

  describe('ESM detection', () => {
    it('should throw when code contains export statement', async () => {
      const mockModule = `
        export const foo = 'bar';
      `;

      mockGet.mockResolvedValue({ data: mockModule });
      await expect(
        importer.import('https://example.com/esm.js')
      ).rejects.toThrow(/ESM module detected/);
    });

    it('should throw when code contains import statement', async () => {
      const mockModule = `
        import { something } from './other';
      `;

      mockGet.mockResolvedValue({ data: mockModule });
      await expect(
        importer.import('https://example.com/esm.js')
      ).rejects.toThrow(/ESM module detected/);
    });

    it('should not throw for valid UMD code', async () => {
      const mockModule = `
        (function (global, factory) {
          if (typeof exports === 'object') {
            factory(exports);
          }
        })(this, function (exports) {
          exports.imported = 'no problem';
        });
      `;

      mockGet.mockResolvedValue({ data: mockModule });
      const result = await importer.import<any>('https://example.com/valid.js');
      expect(result.imported).toBe('no problem');
    });
  });

  describe('dependency pre-fetch', () => {
    let depImporter: UmdImporter;

    beforeEach(() => {
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);
      depImporter = new UmdImporter({
        debug: true,
        cache: true,
        dependencyMap: {
          'lib-a': 'https://example.com/lib-a.js',
        },
      });
    });

    it('should auto-fetch dependency from dependencyMap', async () => {
      const depModule = `
        (function (global, factory) {
          if (typeof exports === 'object') {
            factory(exports);
          }
        })(this, function (exports) {
          exports.libValue = 'from-lib';
        });
      `;

      const mainModule = `
        (function (global, factory) {
          if (typeof exports === 'object') {
            factory(exports, require('lib-a'));
          }
        })(this, function (exports, lib) {
          exports.result = lib.libValue;
        });
      `;

      mockGet
        .mockResolvedValueOnce({ data: mainModule })
        .mockResolvedValueOnce({ data: depModule });

      const result = await depImporter.import<any>('https://example.com/main.js');
      expect(result.result).toBe('from-lib');
    });

    it('should not auto-fetch without dependencyMap', async () => {
      const mainModule = `
        (function (global, factory) {
          if (typeof exports === 'object') {
            factory(exports, require('lib-a'));
          }
        })(this, function (exports, lib) {
          exports.result = lib.libValue;
        });
      `;

      mockGet.mockResolvedValue({ data: mainModule });

      await expect(
        importer.import('https://example.com/main.js')
      ).rejects.toThrow(/Dependency "lib-a"/);
    });
  });
}); 