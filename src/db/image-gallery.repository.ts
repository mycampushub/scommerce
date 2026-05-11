import { Env } from '@/db/types';

export interface GalleryImage {
  id: string;
  filename: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt?: string;
  tags: string[];
  category: string;
  createdAt?: string;
}

export const ImageGalleryRepository = {
  async create(
    env: Env | null,
    data: Omit<GalleryImage, 'id' | 'createdAt'>
  ): Promise<GalleryImage> {
    if (!env?.DB) {
      throw new Error('Database not available');
    }

    const now = new Date().toISOString();
    
    const insertQuery = `INSERT INTO image_gallery (
      filename, url, originalName, mimeType, size, width, height,
      alt, tags, category, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    await env.DB.prepare(insertQuery).bind(
      data.filename,
      data.url,
      data.originalName,
      data.mimeType,
      data.size,
      data.width,
      data.height,
      data.alt || null,
      JSON.stringify(data.tags),
      data.category,
      now
    ).run();

    const insertIdSql = "SELECT last_insert_rowid() as id";
    const insertIdResult = (await env.DB.prepare(insertIdSql).first()) as { id: string } | undefined;
    
    if (!insertIdResult) {
      throw new Error('Failed to insert image gallery item');
    }
    
    const selectQuery = "SELECT * FROM image_gallery WHERE id = ?";
    
    // Use non-null assertion since we check for env?.DB before calling prepare
    const db = env?.DB;
    if (!db) {
      throw new Error('Database not available');
    }
    
    const inserted = await db.prepare(selectQuery)
      .bind(insertIdResult.id)
      .first() as GalleryImage | undefined;

    if (!inserted) {
      throw new Error('Failed to retrieve inserted image');
    }

    return inserted;
  },

  async findAll(env: Env | null, options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<GalleryImage[]> {
    if (!env?.DB) {
      return [];
    }

    let query = 'SELECT * FROM image_gallery ORDER BY createdAt DESC';
    const params: any[] = [];

    if (options?.category) {
      query += ' WHERE category = ?';
      params.push(options.category);
    }

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }

    const stmt = env.DB.prepare(query);
    
    const results = params.length > 0
      ? (await stmt.bind(...params).all()) as GalleryImage[]
      : (await stmt.all()) as GalleryImage[];

    return results || [];
  },

  async delete(env: Env | null, id: string): Promise<void> {
    if (!env?.DB) {
      return;
    }

    await env.DB.prepare('DELETE FROM image_gallery WHERE id = ?')
      .bind(id)
      .run();
  }
};
