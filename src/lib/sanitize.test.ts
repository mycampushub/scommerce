import { describe, it, expect } from 'bun:test';
import {
  sanitizeHTML,
  sanitizeAddressData,
  sanitizeForDB,
  sanitizeEmail,
  sanitizePhone,
  sanitizeProductData,
  sanitizeObject,
  sanitizeArray,
  sanitizeNumber,
  sanitizeBoolean
} from './sanitize';

describe('Sanitization', () => {
  describe('sanitizeHTML', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p><strong>Bold text</strong> and <em>italic text</em></p>';
      const result = sanitizeHTML(input);
      expect(result).toContain('Bold text');
      expect(result).toContain('italic text');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });

    it('should remove script tags', () => {
      const input = '<p>Text</p><script>alert("XSS")</script>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      // DOMPurify with KEEP_CONTENT=false removes the content too
      expect(result).not.toContain('alert');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="malicious.com"></iframe>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<iframe>');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="malicious()">Click me</div>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('malicious');
      expect(result).toContain('Click me'); // Text content is kept
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('javascript:');
      expect(result).toContain('Link');
    });

    it('should remove data attributes by default', () => {
      const input = '<div data-secret="value">Text</div>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('data-secret');
      expect(result).toContain('Text');
    });

    it('should preserve allowed attributes', () => {
      const input = '<a href="https://example.com" target="_blank" rel="noopener" title="Link">Link</a>';
      const result = sanitizeHTML(input);
      expect(result).toContain('href=');
      expect(result).toContain('target=');
      expect(result).toContain('rel=');
    });

    it('should handle non-string input', () => {
      expect(sanitizeHTML(null as any)).toBe('');
      expect(sanitizeHTML(undefined as any)).toBe('');
      expect(sanitizeHTML(123 as any)).toBe('');
    });
  });

  describe('sanitizeForDB', () => {
    it('should strip HTML tags', () => {
      const input = '<p>Text</p><script>alert(1)</script>';
      const result = sanitizeForDB(input);
      expect(result).not.toContain('<p>');
      expect(result).not.toContain('</p>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Text');
    });

    it('should trim whitespace', () => {
      const input = '  text  ';
      const result = sanitizeForDB(input);
      expect(result).toBe('text');
    });

    it('should handle empty string', () => {
      const result = sanitizeForDB('');
      expect(result).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeForDB(null as any)).toBe('');
      expect(sanitizeForDB(undefined as any)).toBe('');
      expect(sanitizeForDB(123 as any)).toBe('');
    });
  });

  describe('sanitizeAddressData', () => {
    it('should sanitize address fields', () => {
      const input = {
        fullName: 'John<script>alert(1)</script> Doe',
        addressLine: '<script>alert(1)</script>123 Main St',
        city: 'Normal City',
        phone: '+1 (234) 567-8900'
      };

      const result = sanitizeAddressData(input);
      expect(result.fullName).not.toContain('<script>');
      expect(result.addressLine).not.toContain('<script>');
      expect(result.city).toBe('Normal City');
      expect(result.phone).toBe('12345678900'); // Should only have digits
    });

    it('should handle empty object', () => {
      const result = sanitizeAddressData({} as any);
      expect(result.fullName).toBe('');
      expect(result.phone).toBe('');
    });

    it('should handle missing fields', () => {
      const input = {
        fullName: 'John Doe'
      } as any;

      const result = sanitizeAddressData(input);
      expect(result.fullName).toBe('John Doe');
      expect(result.phone).toBe('');
    });
  });

  describe('sanitizeProductData', () => {
    it('should sanitize product fields', () => {
      const input = {
        name: 'Product<script>alert(1)</script> Name',
        description: 'Description with <img src=x onerror=alert(1)> image',
        price: 100,
        stock: 10,
        sku: 'SKU-123',
        images: ['<script>alert(1)</script>image1.jpg', 'image2.jpg'],
        categoryId: '123'
      };

      const result = sanitizeProductData(input);
      expect(result.name).not.toContain('<script>');
      expect(result.description).not.toContain('onerror');
      expect(result.price).toBe(100);
      expect(result.stock).toBe(10);
      expect(result.images).not.toContain('<script>');
    });

    it('should preserve numeric fields', () => {
      const input = {
        name: 'Product Name',
        price: 99.99,
        stock: 100,
        comparePrice: 149.99,
        sku: 'SKU-123',
        categoryId: '456'
      };

      const result = sanitizeProductData(input);
      expect(result.price).toBe(99.99);
      expect(result.stock).toBe(100);
      expect(result.comparePrice).toBe(149.99);
    });

    it('should handle missing fields', () => {
      const input = {
        name: 'Product Name'
      } as any;

      const result = sanitizeProductData(input);
      expect(result.name).toBe('Product Name');
      expect(result.price).toBe(0);
      expect(result.stock).toBe(0);
    });
  });

  describe('sanitizeEmail', () => {
    it('should preserve valid email', () => {
      const email = 'user@example.com';
      const result = sanitizeEmail(email);
      expect(result).toBe(email);
    });

    it('should lowercase email', () => {
      const email = 'USER@EXAMPLE.COM';
      const result = sanitizeEmail(email);
      expect(result).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      const email = '  user@example.com  ';
      const result = sanitizeEmail(email);
      expect(result).toBe('user@example.com');
    });

    it('should reject invalid email', () => {
      expect(sanitizeEmail('invalid')).toBe('');
      expect(sanitizeEmail('user@')).toBe('');
      expect(sanitizeEmail('@example.com')).toBe('');
    });

    it('should remove HTML from email', () => {
      const email = '<script>alert(1)</script>user@example.com<script>alert(2)</script>';
      const result = sanitizeEmail(email);
      expect(result).not.toContain('<script>');
      // Should also fail email validation
      expect(result).toBe('');
    });

    it('should handle empty string', () => {
      const result = sanitizeEmail('');
      expect(result).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeEmail(null as any)).toBe('');
      expect(sanitizeEmail(undefined as any)).toBe('');
    });
  });

  describe('sanitizePhone', () => {
    it('should preserve valid phone numbers', () => {
      const phone = '+1234567890';
      const result = sanitizePhone(phone);
      expect(result).toBe('1234567890');
    });

    it('should remove non-digit characters', () => {
      const phone = '+1 (234) 567-8900';
      const result = sanitizePhone(phone);
      expect(result).toBe('12345678900');
    });

    it('should handle empty string', () => {
      const result = sanitizePhone('');
      expect(result).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizePhone(null as any)).toBe('');
      expect(sanitizePhone(undefined as any)).toBe('');
    });

    it('should remove HTML from phone', () => {
      const phone = '<script>alert(1)</script>1234567890<script>alert(2)</script>';
      const result = sanitizePhone(phone);
      expect(result).not.toContain('<script>');
      expect(result).toBe('1234567890');
    });
  });

  describe('sanitizeNumber', () => {
    it('should convert valid numbers', () => {
      expect(sanitizeNumber('100')).toBe(100);
      expect(sanitizeNumber('99.99')).toBe(99.99);
      expect(sanitizeNumber(0)).toBe(0);
      expect(sanitizeNumber(-10)).toBe(-10);
    });

    it('should return default for invalid numbers', () => {
      expect(sanitizeNumber('invalid')).toBe(0);
      expect(sanitizeNumber(NaN)).toBe(0);
      expect(sanitizeNumber(null)).toBe(0);
      expect(sanitizeNumber(undefined)).toBe(0);
    });

    it('should use provided default', () => {
      expect(sanitizeNumber('invalid', 100)).toBe(100);
      expect(sanitizeNumber(null, 50)).toBe(50);
    });

    it('should handle boolean', () => {
      expect(sanitizeNumber(true)).toBe(1);
      expect(sanitizeNumber(false)).toBe(0);
    });
  });

  describe('sanitizeBoolean', () => {
    it('should preserve boolean values', () => {
      expect(sanitizeBoolean(true)).toBe(true);
      expect(sanitizeBoolean(false)).toBe(false);
    });

    it('should convert string "true" to true', () => {
      expect(sanitizeBoolean('true')).toBe(true);
      expect(sanitizeBoolean('TRUE')).toBe(true);
      expect(sanitizeBoolean('True')).toBe(true);
    });

    it('should convert string "false" to false', () => {
      expect(sanitizeBoolean('false')).toBe(false);
      expect(sanitizeBoolean('FALSE')).toBe(false);
      expect(sanitizeBoolean('False')).toBe(false);
    });

    it('should convert number to boolean', () => {
      expect(sanitizeBoolean(1)).toBe(true);
      expect(sanitizeBoolean(0)).toBe(false);
      expect(sanitizeBoolean(-1)).toBe(true);
    });

    it('should use default for invalid values', () => {
      expect(sanitizeBoolean(null)).toBe(false);
      expect(sanitizeBoolean(undefined)).toBe(false);
      expect(sanitizeBoolean('invalid')).toBe(false);
    });

    it('should use provided default', () => {
      expect(sanitizeBoolean(null, true)).toBe(true);
      expect(sanitizeBoolean('invalid', true)).toBe(true);
    });
  });

  describe('sanitizeArray', () => {
    it('should filter string array', () => {
      const input = ['<script>alert(1)</script>', 'normal', 123, null, undefined];
      const result = sanitizeArray<string>(input, 'string');
      expect(result).toEqual(['<script>alert(1)</script>', 'normal']);
    });

    it('should filter number array', () => {
      const input = [123, 456, '789', NaN, null, undefined];
      const result = sanitizeArray<number>(input, 'number');
      expect(result).toEqual([123, 456, 789]);
    });

    it('should filter boolean array', () => {
      const input = [true, false, 'true', 1, 0, null, undefined];
      const result = sanitizeArray<boolean>(input, 'boolean');
      expect(result).toEqual([true, false]);
    });

    it('should handle non-array input', () => {
      expect(sanitizeArray<string>(null, 'string')).toEqual([]);
      expect(sanitizeArray<number>(undefined, 'number')).toEqual([]);
      expect(sanitizeArray<boolean>('invalid' as any, 'boolean')).toEqual([]);
    });

    it('should handle empty array', () => {
      expect(sanitizeArray<string>([], 'string')).toEqual([]);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize object string values', () => {
      const input = {
        name: 'Test<script>alert(1)</script>',
        description: '<img src=x onerror=alert(1)>',
        normal: 'normal value',
        nested: {
          html: '<script>alert(1)</script>'
        }
      };

      const result = sanitizeObject(input);
      expect(result.name).toBe('Testalert(1)'); // HTML stripped, alert(1) remains (text-only)
      expect(result.description).not.toContain('onerror');
      expect(result.normal).toBe('normal value');
      expect(result.nested?.html).toBe('alert(1)');
    });

    it('should remove null and undefined values', () => {
      const input = {
        name: 'Test',
        nullValue: null,
        undefinedValue: undefined,
        empty: ''
      };

      const result = sanitizeObject(input);
      expect(result.name).toBe('Test');
      expect(result.nullValue).toBeUndefined();
      expect(result.undefinedValue).toBeUndefined();
      expect(result.empty).toBe(''); // Empty string is kept
    });

    it('should filter by allowed keys', () => {
      const input = {
        name: 'Test',
        allowed: 'value',
        notAllowed: 'remove this',
        nested: {
          allowed: 'value',
          notAllowed: 'remove this'
        }
      };

      const result = sanitizeObject(input, ['name', 'allowed', 'nested']);
      expect(result.name).toBe('Test');
      expect(result.allowed).toBe('value');
      expect(result.notAllowed).toBeUndefined();
      expect(result.nested?.allowed).toBe('value');
      expect((result.nested as any)?.notAllowed).toBeUndefined();
    });

    it('should handle non-object input', () => {
      expect(sanitizeObject(null)).toEqual({});
      expect(sanitizeObject(undefined)).toEqual({});
      expect(sanitizeObject('string' as any)).toEqual({});
      expect(sanitizeObject([] as any)).toEqual({});
    });

    it('should handle array input', () => {
      expect(sanitizeObject([1, 2, 3] as any)).toEqual({});
    });
  });

  describe('security', () => {
    it('should block SVG-based XSS', () => {
      const input = '<svg onload=alert(1)></svg>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onload');
      expect(result).not.toContain('alert');
    });

    it('should block object tags', () => {
      const input = '<object data="malicious.swf"></object>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<object>');
    });

    it('should block embed tags', () => {
      const input = '<embed src="malicious.swf">';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<embed>');
    });

    it('should block form tags', () => {
      const input = '<form action="evil.com"><input type="text"></form>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<form>');
      expect(result).not.toContain('<input>');
    });

    it('should block input tags', () => {
      const input = '<input type="text" value="default">';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<input>');
    });

    it('should block multiple event handlers', () => {
      const input = '<div onclick="alert(1)" onerror="alert(2)" onload="alert(3)">Text</div>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('onload');
    });

    it('should block onmouseover', () => {
      const input = '<div onmouseover="alert(1)">Hover me</div>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onmouseover');
    });

    it('should block onfocus', () => {
      const input = '<input onfocus="alert(1)">';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onfocus');
    });

    it('should block onblur', () => {
      const input = '<input onblur="alert(1)">';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onblur');
    });

    it('should block onchange', () => {
      const input = '<select onchange="alert(1)"><option>Test</option></select>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onchange');
    });

    it('should block onsubmit', () => {
      const input = '<form onsubmit="alert(1)"><button>Submit</button></form>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onsubmit');
    });
  });
});
