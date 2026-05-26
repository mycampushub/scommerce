import { Env, Banner } from '@/db/types';
import {
  generateId,
  boolToNumber,
  numberToBool,
  now,
  queryFirst,
  queryAll,
  execute,
} from '@/db/db';

export class BannerRepository {
  /**
   * Find banner by ID
   */
  static async findById(env: Env | null, id: string): Promise<Banner | null> {
    return queryFirst<Banner>(
      env,
      'SELECT * FROM banners WHERE id = ? LIMIT 1',
      id
    );
  }

  /**
   * Create new banner
   */
  static async create(env: Env | null, data: {
    title: string;
    description?: string;
    image: string;
    mobileImage?: string;
    buttonText?: string;
    buttonLink?: string;
    isActive?: boolean;
    order?: number;
  }): Promise<Banner> {
    const id = generateId();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO banners (id, title, description, image, mobileImage, buttonText, buttonLink, isActive, "order", createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.title,
      data.description || null,
      data.image,
      data.mobileImage || null,
      data.buttonText || null,
      data.buttonLink || null,
      boolToNumber(data.isActive !== undefined ? data.isActive : true),
      data.order || 0,
      currentTime,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Update banner
   */
  static async update(env: Env | null, id: string, data: Partial<Banner>): Promise<Banner | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.image !== undefined) {
      updates.push('image = ?');
      values.push(data.image);
    }
    if (data.mobileImage !== undefined) {
      updates.push('mobileImage = ?');
      values.push(data.mobileImage);
    }
    if (data.buttonText !== undefined) {
      updates.push('buttonText = ?');
      values.push(data.buttonText);
    }
    if (data.buttonLink !== undefined) {
      updates.push('buttonLink = ?');
      values.push(data.buttonLink);
    }
    if (data.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(boolToNumber(data.isActive));
    }
    if (data.order !== undefined) {
      updates.push('"order" = ?');
      values.push(data.order);
    }

    if (updates.length === 0) return this.findById(env, id);

    updates.push('updatedAt = ?');
    values.push(now());
    values.push(id);

    await execute(
      env,
      `UPDATE banners SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findById(env, id);
  }

  /**
   * Delete banner
   */
  static async delete(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM banners WHERE id = ?', id);
  }

  /**
   * Get all active banners
   */
  static async findAllActive(env: Env | null): Promise<Banner[]> {
    try {
      const banners = await queryAll<Banner>(
        env,
        'SELECT * FROM banners WHERE isActive = 1 ORDER BY "order" ASC, createdAt DESC'
      );
      // Ensure banners is always an array
      return Array.isArray(banners) ? banners : [];
    } catch (error) {
      console.error('[BannerRepository] Error fetching active banners:', error);
      return [];
    }
  }

  /**
   * Get all banners (with pagination)
   */
  static async findAll(env: Env | null): Promise<Banner[]> {
    try {
      const banners = await queryAll<Banner>(
        env,
        'SELECT * FROM banners ORDER BY "order" ASC, createdAt DESC'
      );
      // Ensure banners is always an array
      const bannersArray = Array.isArray(banners) ? banners : [];
      return bannersArray.map(b => ({
        ...b,
      }));
    } catch (error) {
      console.error('[BannerRepository] Error fetching banners:', error);
      return [];
    }
  }

  /**
   * Reorder banners
   */
  static async reorder(env: Env | null, bannerIds: string[]): Promise<void> {
    for (let i = 0; i < bannerIds.length; i++) {
      await execute(
        env,
        'UPDATE banners SET "order" = ?, updatedAt = ? WHERE id = ?',
        i,
        now(),
        bannerIds[i]
      );
    }
  }
}
