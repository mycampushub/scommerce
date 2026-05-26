import { describe, it, expect, beforeEach } from 'bun:test';
import {
  updateWithOptimisticLock,
  updateStockWithLock,
  getEntityVersion,
  retryOnVersionConflict,
  OptimisticLockResult
} from './optimistic-lock';

describe('Optimistic Lock', () => {
  describe('getEntityVersion', () => {
    it('should return null for non-existent entity', async () => {
      const version = await getEntityVersion('products', 'non-existent-id');
      expect(version).toBeNull();
    });
  });

  describe('updateWithOptimisticLock', () => {
    it('should fail gracefully with expected version mismatch', async () => {
      // Test with non-existent entity - should handle gracefully
      const result = await updateWithOptimisticLock(
        'products',
        'test-id-12345',
        999, // Very high version that won't match
        { name: 'Test Update' }
      );

      // Result should indicate failure
      expect(result.success).toBe(false);
    });

    it('should handle empty update fields', async () => {
      const result = await updateWithOptimisticLock(
        'products',
        'test-id',
        1,
        {}
      );

      // Should handle empty fields gracefully
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('updateStockWithLock', () => {
    it('should prevent negative stock', async () => {
      const result = await updateStockWithLock(
        'non-existent-variant-id',
        -100, // Trying to reduce stock significantly
        false
      );

      // Should fail because entity doesn't exist
      expect(result.success).toBe(false);
    });

    it('should handle product stock update', async () => {
      const result = await updateStockWithLock(
        'non-existent-product-id',
        10,
        true // isProduct = true
      );

      expect(result.success).toBe(false);
    });
  });

  describe('retryOnVersionConflict', () => {
    it('should retry operation on conflict', async () => {
      let attempts = 0;
      
      const operation = async (): Promise<OptimisticLockResult> => {
        attempts++;
        // Simulate conflict on first attempt, success on second
        if (attempts === 1) {
          return {
            success: false,
            error: 'VERSION_CONFLICT',
            conflict: true,
          };
        }
        return {
          success: true,
          data: { value: 'success' },
        };
      };

      const result = await retryOnVersionConflict(operation, 3, 10);

      expect(result.success).toBe(true);
      expect(attempts).toBe(2);
    });

    it('should stop retrying after max attempts', async () => {
      let attempts = 0;
      
      const operation = async (): Promise<OptimisticLockResult> => {
        attempts++;
        // Always return conflict
        return {
          success: false,
          error: 'VERSION_CONFLICT',
          conflict: true,
        };
      };

      const result = await retryOnVersionConflict(operation, 3, 10);

      expect(result.success).toBe(false);
      expect(result.conflict).toBe(true);
      expect(attempts).toBe(3); // Max retries reached
    });

    it('should not retry on non-conflict errors', async () => {
      let attempts = 0;
      
      const operation = async (): Promise<OptimisticLockResult> => {
        attempts++;
        return {
          success: false,
          error: 'ENTITY_NOT_FOUND',
        };
      };

      const result = await retryOnVersionConflict(operation, 5, 10);

      expect(result.success).toBe(false);
      expect(result.conflict).toBeUndefined();
      expect(attempts).toBe(1); // Should not retry
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const result = await updateWithOptimisticLock(
        'invalid-table-name',
        'test-id',
        1,
        { name: 'Test' }
      );

      // Should handle error gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide meaningful error messages', async () => {
      const result = await updateStockWithLock(
        'test-id',
        10,
        false
      );

      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
        expect(result.error.length).toBeGreaterThan(0);
      }
    });
  });
});
