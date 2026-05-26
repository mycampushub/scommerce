import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { logger } from './logger';

describe('Logger', () => {
  let originalEnv: string | undefined;
  let originalLog: any;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    originalLog = console.log;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    console.log = originalLog;
  });

  describe('log levels', () => {
    it('should log debug messages', () => {
      expect(() => {
        logger.debug('Test debug message', { key: 'value' });
      }).not.toThrow();
    });

    it('should log info messages', () => {
      expect(() => {
        logger.info('Test info message', { key: 'value' });
      }).not.toThrow();
    });

    it('should log warn messages', () => {
      expect(() => {
        logger.warn('Test warn message', { key: 'value' });
      }).not.toThrow();
    });

    it('should log error messages', () => {
      expect(() => {
        logger.error('Test error message', { key: 'value' });
      }).not.toThrow();
    });
  });

  describe('convenience methods', () => {
    it('should log API requests', () => {
      expect(() => {
        logger.apiRequest('GET', '/api/products');
      }).not.toThrow();
    });

    it('should log API responses', () => {
      expect(() => {
        logger.apiResponse('GET', '/api/products', 200);
      }).not.toThrow();
    });

    it('should log DB queries', () => {
      expect(() => {
        logger.dbQuery('SELECT * FROM products');
      }).not.toThrow();
    });

    it('should log auth actions', () => {
      expect(() => {
        logger.authAction('login', 'user-123');
      }).not.toThrow();
    });

    it('should log admin actions', () => {
      expect(() => {
        logger.adminAction('update_product', 'admin-456');
      }).not.toThrow();
    });
  });

  describe('PII sanitization', () => {
    it('should redact password fields', () => {
      const originalLog = console.log;
      let loggedContent = '';
      console.log = (...args: any[]) => {
        loggedContent += JSON.stringify(args);
      };
      process.env.NODE_ENV = 'development';

      logger.info('User login', {
        email: 'test@example.com',
        password: 'secret123'
      });

      expect(loggedContent).toContain('[REDACTED]');
      expect(loggedContent).not.toContain('secret123');

      console.log = originalLog;
    });

    it('should redact token fields', () => {
      const originalLog = console.log;
      let loggedContent = '';
      console.log = (...args: any[]) => {
        loggedContent += JSON.stringify(args);
      };
      process.env.NODE_ENV = 'development';

      logger.info('Auth attempt', {
        accessToken: 'abc123',
        refreshToken: 'def456'
      });

      expect(loggedContent).toContain('[REDACTED]');
      expect(loggedContent).not.toContain('abc123');
      expect(loggedContent).not.toContain('def456');

      console.log = originalLog;
    });

    it('should redact apiKey fields', () => {
      const originalLog = console.log;
      let loggedContent = '';
      console.log = (...args: any[]) => {
        loggedContent += JSON.stringify(args);
      };
      process.env.NODE_ENV = 'development';

      logger.info('API call', {
        apiKey: 'sk_test_123',
        data: 'normal data'
      });

      expect(loggedContent).toContain('[REDACTED]');
      expect(loggedContent).not.toContain('sk_test_123');
      expect(loggedContent).toContain('normal data');

      console.log = originalLog;
    });

    it('should redact nested sensitive data', () => {
      const originalLog = console.log;
      let loggedContent = '';
      console.log = (...args: any[]) => {
        loggedContent += JSON.stringify(args);
      };
      process.env.NODE_ENV = 'development';

      logger.info('User data', {
        user: {
          name: 'Test User',
          password: 'secret',
          nested: {
            creditCard: '4111111111111111'
          }
        }
      });

      expect(loggedContent).toContain('[REDACTED]');
      expect(loggedContent).not.toContain('secret');
      expect(loggedContent).not.toContain('4111111111111111');
      expect(loggedContent).toContain('Test User');

      console.log = originalLog;
    });
  });

  describe('request ID tracking', () => {
    it('should set and clear request ID', () => {
      const requestId = 'req-123';
      logger.setRequestId(requestId);
      // Request ID is used internally but not directly exposed
      logger.clearRequestId();
      expect(() => logger.clearRequestId()).not.toThrow();
    });
  });
});
