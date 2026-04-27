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
  static async findById(env: Env, id: string): Promise<Banner | null> {
    return queryFirst<Banner>(
      env,
      'SELECT * FROM banners WHERE id = ? LIMIT 1',
      id
    );
  }

  /**
   * Create new banner
   */
  static async create(env: Env, data: {
    title: string;
    description?: string;
    image: string;
    mobileImage?: string;
    buttonText?: string;
    buttonLink?: string;
    isActive?: boolean;
    orderNum?: number;
  }): Promise<Banner> {
    const id = generateId();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO banners (id, title, description, image, mobileImage, buttonText, buttonLink, isActive, orderNum, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.title,
      data.description || null,
      data.image,
      data.mobileImage || null,
      data.buttonText || null,
      data.buttonLink || null,
      boolToNumber(data.isActive !== undefined ? data.isActive : true),
      data.orderNum || 0,
      currentTime,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Update banner
   */
  static async update(env: Env, id: string, data: Partial<Banner>): Promise<Banner | null> {
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
    if (data.orderNum !== undefined) {
      updates.push('orderNum = ?');
      values.push(data.orderNum);
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
  static async delete(env: Env, id: string): Promise<void> {
    await execute(env, 'DELETE FROM banners WHERE id = ?', id);
  }

  /**
   * Get all active banners
   */
  static async findAllActive(env: Env): Promise<Banner[]> {
    const banners = await queryAll<Banner>(
      env,
      'SELECT * FROM banners WHERE isActive = 1 ORDER BY orderNum ASC, createdAt DESC'
    );
    return banners.map(b => ({
      ...b,
      isActive: numberToBool(b.isActive),
    }));
  }

  /**
   * Get all banners (with pagination)
   */
  static async findAll(env: Env): Promise<Banner[]> {
    const banners = await queryAll<Banner>(
      env,
      'SELECT * FROM banners ORDER BY orderNum ASC, createdAt DESC'
    );
    return banners.map(b => ({
      ...b,
      isActive: numberToBool(b.isActive),
    }));
  }

  /**
   * Reorder banners
   */
  static async reorder(env: Env, bannerIds: string[]): Promise<void> {
    for (let i = 0; i < bannerIds.length; i++) {
      await execute(
        env,
        'UPDATE banners SET orderNum = ?, updatedAt = ? WHERE id = ?',
        i,
        now(),
        bannerIds[i]
      );
    }
  }
}
