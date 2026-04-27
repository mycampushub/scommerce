import { Env, HomepageSettings } from '@/db/types';
import {
  generateId,
  boolToNumber,
  now,
  queryFirst,
  queryAll,
  execute,
  parseJSON,
  stringifyJSON,
} from '@/db/db';

export interface HomepageSettingsData {
  id?: string;
  sectionName: string;
  isEnabled?: boolean;
  autoPlay?: number;
  displayLimit?: number | null;
  settings?: Record<string, unknown> | null;
}

export class HomepageSettingsRepository {
  /**
   * Find homepage setting by section name
   */
  static async findBySection(env: Env, sectionName: string): Promise<HomepageSettings | null> {
    const setting = await queryFirst<HomepageSettings>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      sectionName
    );
    if (setting && setting.settings) {
      setting.settings = parseJSON<Record<string, unknown>>(setting.settings);
    }
    return setting;
  }

  /**
   * Find homepage setting by ID
   */
  static async findById(env: Env, id: string): Promise<HomepageSettings | null> {
    const setting = await queryFirst<HomepageSettings>(
      env,
      'SELECT * FROM homepage_settings WHERE id = ? LIMIT 1',
      id
    );
    if (setting && setting.settings) {
      setting.settings = parseJSON<Record<string, unknown>>(setting.settings);
    }
    return setting;
  }

  /**
   * Create or update homepage setting
   */
  static async upsert(env: Env, data: HomepageSettingsData): Promise<HomepageSettings> {
    const currentTime = now();
    const existing = await this.findBySection(env, data.sectionName);

    if (existing) {
      // Update existing
      const updates: string[] = [];
      const values: unknown[] = [];

      if (data.isEnabled !== undefined) {
        updates.push('isEnabled = ?');
        values.push(boolToNumber(data.isEnabled));
      }
      if (data.autoPlay !== undefined) {
        updates.push('autoPlay = ?');
        values.push(data.autoPlay);
      }
      if (data.displayLimit !== undefined) {
        updates.push('displayLimit = ?');
        values.push(data.displayLimit);
      }
      if (data.settings !== undefined) {
        updates.push('settings = ?');
        values.push(data.settings ? stringifyJSON(data.settings) : null);
      }

      if (updates.length === 0) return existing;

      updates.push('updatedAt = ?');
      values.push(currentTime);
      values.push(existing.id);

      await execute(
        env,
        `UPDATE homepage_settings SET ${updates.join(', ')} WHERE id = ?`,
        ...values
      );

      return (await this.findById(env, existing.id))!;
    } else {
      // Create new
      const id = generateId();

      await execute(
        env,
        `INSERT INTO homepage_settings (id, sectionName, isEnabled, autoPlay, displayLimit, settings, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        data.sectionName,
        boolToNumber(data.isEnabled !== undefined ? data.isEnabled : true),
        data.autoPlay ?? 5000,
        data.displayLimit ?? null,
        data.settings ? stringifyJSON(data.settings) : null,
        currentTime
      );

      return (await this.findById(env, id))!;
    }
  }

  /**
   * Update homepage setting
   */
  static async update(env: Env, id: string, data: Partial<HomepageSettings>): Promise<HomepageSettings | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.isEnabled !== undefined) {
      updates.push('isEnabled = ?');
      values.push(boolToNumber(data.isEnabled));
    }
    if (data.autoPlay !== undefined) {
      updates.push('autoPlay = ?');
      values.push(data.autoPlay);
    }
    if (data.displayLimit !== undefined) {
      updates.push('displayLimit = ?');
      values.push(data.displayLimit);
    }
    if (data.settings !== undefined) {
      updates.push('settings = ?');
      values.push(data.settings ? stringifyJSON(data.settings) : null);
    }

    if (updates.length === 0) return this.findById(env, id);

    updates.push('updatedAt = ?');
    values.push(now());
    values.push(id);

    await execute(
      env,
      `UPDATE homepage_settings SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findById(env, id);
  }

  /**
   * Delete homepage setting
   */
  static async delete(env: Env, id: string): Promise<void> {
    await execute(env, 'DELETE FROM homepage_settings WHERE id = ?', id);
  }

  /**
   * Get all homepage settings
   */
  static async findAll(env: Env): Promise<HomepageSettings[]> {
    const settings = await queryAll<HomepageSettings>(
      env,
      'SELECT * FROM homepage_settings ORDER BY sectionName ASC'
    );
    return settings.map(s => ({
      ...s,
      settings: s.settings ? parseJSON<Record<string, unknown>>(s.settings) : null
    }));
  }

  /**
   * Get all enabled homepage settings
   */
  static async findAllEnabled(env: Env): Promise<HomepageSettings[]> {
    const settings = await queryAll<HomepageSettings>(
      env,
      'SELECT * FROM homepage_settings WHERE isEnabled = 1 ORDER BY sectionName ASC'
    );
    return settings.map(s => ({
      ...s,
      settings: s.settings ? parseJSON<Record<string, unknown>>(s.settings) : null
    }));
  }

  /**
   * Get default settings for a section
   */
  static getDefaultSettings(sectionName: string): HomepageSettingsData {
    const defaults: Record<string, HomepageSettingsData> = {
      banners: {
        sectionName: 'banners',
        isEnabled: true,
        autoPlay: 5000,
        displayLimit: 5,
        settings: { autoplay: true, infinite: true, showDots: true, showArrows: true }
      },
      stories: {
        sectionName: 'stories',
        isEnabled: true,
        autoPlay: 5000,
        displayLimit: 10,
        settings: { autoplay: true, showProgress: true }
      },
      reels: {
        sectionName: 'reels',
        isEnabled: true,
        autoPlay: 0,
        displayLimit: 10,
        settings: { autoplay: false, muted: true }
      },
      featuredProducts: {
        sectionName: 'featuredProducts',
        isEnabled: true,
        autoPlay: 0,
        displayLimit: 10,
        settings: { autoScroll: false, showAddToCart: true }
      },
      newArrivals: {
        sectionName: 'newArrivals',
        isEnabled: true,
        autoPlay: 0,
        displayLimit: 10,
        settings: { sortBy: 'createdAt', sortOrder: 'DESC' }
      },
      categories: {
        sectionName: 'categories',
        isEnabled: true,
        autoPlay: 0,
        displayLimit: 12,
        settings: { layout: 'grid', showImages: true }
      }
    };

    return defaults[sectionName] || {
      sectionName,
      isEnabled: true,
      autoPlay: 0,
      displayLimit: 10,
      settings: null
    };
  }
}
