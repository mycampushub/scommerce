import { Env } from '@/db/types';
import {
  generateId,
  boolToNumber,
  numberToBool,
  now,
  queryFirst,
  queryAll,
  execute,
  parseJSON,
  stringifyJSON
} from '@/db/db';

export interface ImageGalleryItem {
  id: string;
  filename: string;
  url: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  alt?: string;
  tags?: string[];
  category?: string;
  usageCount: number;
  isActive: boolean;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ImageGalleryRepository {
  /**
   * Create new gallery image
   */
  static async create(env: Env | null, data: {
    filename: string;
    url: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
    width?: number;
    height?: number;
    alt?: string;
    tags?: string[];
    category?: string;
    uploadedBy?: string;
  }): Promise<ImageGalleryItem> {
    const id = generateId();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO image_gallery (id, filename, url, originalName, mimeType, size, width, height,
       alt, tags, category, usageCount, isActive, uploadedBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.filename,
      data.url,
      data.originalName || null,
      data.mimeType || null,
      data.size || null,
      data.width || null,
      data.height || null,
      data.alt || null,
      data.tags ? stringifyJSON(data.tags) : null,
      data.category || 'general',
      0,
      boolToNumber(true),
      data.uploadedBy || null,
      currentTime,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Find image by ID
   */
  static async findById(env: Env | null, id: string): Promise<ImageGalleryItem | null> {
    const image = await queryFirst<any>(
      env,
      'SELECT * FROM image_gallery WHERE id = ? LIMIT 1',
      id
    );
    if (!image) return null;

    return {
      ...image,
      tags: parseJSON<string[]>(image.tags) || [],
      isActive: numberToBool(image.isActive),
    };
  }

  /**
   * Find image by URL
   */
  static async findByUrl(env: Env | null, url: string): Promise<ImageGalleryItem | null> {
    const image = await queryFirst<any>(
      env,
      'SELECT * FROM image_gallery WHERE url = ? LIMIT 1',
      url
    );
    if (!image) return null;

    return {
      ...image,
      tags: parseJSON<string[]>(image.tags) || [],
      isActive: numberToBool(image.isActive),
    };
  }

  /**
   * Get all gallery images
   */
  static async findAll(
    env: Env | null,
    options: {
      category?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ImageGalleryItem[]> {
    const { category, isActive, limit = 50, offset = 0 } = options;

    const conditions: string[] = [];
    const params: any[] = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (isActive !== undefined) {
      conditions.push('isActive = ?');
      params.push(boolToNumber(isActive));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const images = await queryAll<any>(
      env,
      `SELECT * FROM image_gallery ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );

    return images.map((image) => ({
      ...image,
      tags: parseJSON<string[]>(image.tags) || [],
      isActive: numberToBool(image.isActive),
    }));
  }

  /**
   * Search gallery images
   */
  static async search(
    env: Env | null,
    query: string,
    options: {
      category?: string;
      limit?: number;
    } = {}
  ): Promise<ImageGalleryItem[]> {
    const { category, limit = 50 } = options;

    const conditions: string[] = ['isActive = 1'];
    const params: any[] = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (query) {
      conditions.push('(filename LIKE ? OR originalName LIKE ? OR alt LIKE ? OR tags LIKE ?)');
      params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const images = await queryAll<any>(
      env,
      `SELECT * FROM image_gallery ${whereClause} ORDER BY createdAt DESC LIMIT ?`,
      ...params,
      limit
    );

    return images.map((image) => ({
      ...image,
      tags: parseJSON<string[]>(image.tags) || [],
      isActive: numberToBool(image.isActive),
    }));
  }

  /**
   * Increment usage count
   */
  static async incrementUsage(env: Env | null, id: string): Promise<void> {
    await execute(
      env,
      'UPDATE image_gallery SET usageCount = usageCount + 1, updatedAt = ? WHERE id = ?',
      now(),
      id
    );
  }

  /**
   * Update image metadata
   */
  static async update(env: Env | null, id: string, data: Partial<ImageGalleryItem>): Promise<ImageGalleryItem | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.alt !== undefined) {
      updates.push('alt = ?');
      values.push(data.alt);
    }
    if (data.tags !== undefined) {
      updates.push('tags = ?');
      values.push(stringifyJSON(data.tags));
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      values.push(data.category);
    }
    if (data.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(typeof data.isActive === 'boolean' ? boolToNumber(data.isActive) : data.isActive);
    }

    if (updates.length === 0) return this.findById(env, id);

    updates.push('updatedAt = ?');
    values.push(now());
    values.push(id);

    await execute(
      env,
      `UPDATE image_gallery SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findById(env, id);
  }

  /**
   * Delete image from gallery
   */
  static async delete(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM image_gallery WHERE id = ?', id);
  }

  /**
   * Get image stats by category
   */
  static async getStats(env: Env | null): Promise<{ category: string; count: number }[]> {
    const result = await queryAll<any>(
      env,
      'SELECT category, COUNT(*) as count FROM image_gallery WHERE isActive = 1 GROUP BY category'
    );

    return result.map((row) => ({
      category: row.category,
      count: row.count,
    }));
  }

  /**
   * Get popular images (by usage count)
   */
  static async getPopular(env: Env | null, limit: number = 20): Promise<ImageGalleryItem[]> {
    const images = await queryAll<any>(
      env,
      `SELECT * FROM image_gallery WHERE isActive = 1 ORDER BY usageCount DESC LIMIT ?`,
      limit
    );

    return images.map((image) => ({
      ...image,
      tags: parseJSON<string[]>(image.tags) || [],
      isActive: numberToBool(image.isActive),
    }));
  }
}
