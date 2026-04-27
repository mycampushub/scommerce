import { Env, Story } from '@/db/types';
import {
  generateId,
  boolToNumber,
  numberToBool,
  now,
  queryFirst,
  queryAll,
  execute,
  parseJSON,
  stringifyJSON,
} from '@/db/db';

export class StoryRepository {
  /**
   * Find story by ID
   */
  static async findById(env: Env, id: string): Promise<Story | null> {
    const story = await queryFirst<Story>(
      env,
      'SELECT * FROM stories WHERE id = ? LIMIT 1',
      id
    );
    if (story) {
      story.images = parseJSON<string[]>(story.images) || [];
    }
    return story;
  }

  /**
   * Create new story
   */
  static async create(env: Env, data: {
    title: string;
    thumbnail: string;
    images: string[];
    isActive?: boolean;
    orderNum?: number;
  }): Promise<Story> {
    const id = generateId();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO stories (id, title, thumbnail, images, isActive, orderNum, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.title,
      data.thumbnail,
      stringifyJSON(data.images),
      boolToNumber(data.isActive !== undefined ? data.isActive : true),
      data.orderNum || 0,
      currentTime,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Update story
   */
  static async update(env: Env, id: string, data: Partial<Story>): Promise<Story | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.thumbnail !== undefined) {
      updates.push('thumbnail = ?');
      values.push(data.thumbnail);
    }
    if (data.images !== undefined) {
      updates.push('images = ?');
      values.push(stringifyJSON(data.images));
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
      `UPDATE stories SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findById(env, id);
  }

  /**
   * Delete story
   */
  static async delete(env: Env, id: string): Promise<void> {
    await execute(env, 'DELETE FROM stories WHERE id = ?', id);
  }

  /**
   * Get all active stories
   */
  static async findAllActive(env: Env): Promise<Story[]> {
    const stories = await queryAll<Story>(
      env,
      'SELECT * FROM stories WHERE isActive = 1 ORDER BY orderNum ASC, createdAt DESC'
    );
    return stories.map(s => ({
      ...s,
      isActive: numberToBool(s.isActive),
      images: parseJSON<string[]>(s.images) || [],
    }));
  }

  /**
   * Get all stories (with pagination)
   */
  static async findAll(env: Env): Promise<Story[]> {
    const stories = await queryAll<Story>(
      env,
      'SELECT * FROM stories ORDER BY orderNum ASC, createdAt DESC'
    );
    return stories.map(s => ({
      ...s,
      isActive: numberToBool(s.isActive),
      images: parseJSON<string[]>(s.images) || [],
    }));
  }

  /**
   * Reorder stories
   */
  static async reorder(env: Env, storyIds: string[]): Promise<void> {
    for (let i = 0; i < storyIds.length; i++) {
      await execute(
        env,
        'UPDATE stories SET orderNum = ?, updatedAt = ? WHERE id = ?',
        i,
        now(),
        storyIds[i]
      );
    }
  }
}
