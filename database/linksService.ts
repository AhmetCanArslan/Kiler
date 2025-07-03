import { Platform } from 'react-native';
import { db } from './database';

export interface Link {
  id?: number;
  title: string;
  url: string;
  description?: string;
  tags?: string[];
  favicon_url?: string;
  preview_image_url?: string;
  created_at?: string;
  updated_at?: string;
  is_favorite?: boolean;
  is_deleted?: boolean;
  visit_count?: number;
  last_visited_at?: string;
}

export interface LinkCreate {
  title: string;
  url: string;
  description?: string;
  tags?: string[];
}

export interface LinkUpdate {
  title?: string;
  url?: string;
  description?: string;
  tags?: string[];
  is_favorite?: boolean;
}

interface DatabaseRow {
  id: number;
  title: string;
  url: string;
  description: string | null;
  tags: string;
  favicon_url: string | null;
  preview_image_url: string | null;
  created_at: string;
  updated_at: string;
  is_favorite: number;
  is_deleted: number;
  visit_count: number;
  last_visited_at: string | null;
}

// Helper function to convert tags array to JSON string
const tagsToJson = (tags?: string[]): string => {
  return tags ? JSON.stringify(tags) : '[]';
};

// Helper function to convert JSON string to tags array
const jsonToTags = (tagsJson: string): string[] => {
  try {
    return JSON.parse(tagsJson || '[]');
  } catch {
    return [];
  }
};

// Helper function to get database with platform check
const getDatabase = async () => {
  if (Platform.OS === 'web') {
    throw new Error('Database operations not supported on web platform');
  }
  const database = await db;
  if (!database) {
    throw new Error('Database not available');
  }
  return database;
};

// Helper function to convert database row to Link
const rowToLink = (row: DatabaseRow): Link => ({
  id: row.id,
  title: row.title,
  url: row.url,
  description: row.description || undefined,
  tags: jsonToTags(row.tags),
  favicon_url: row.favicon_url || undefined,
  preview_image_url: row.preview_image_url || undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
  is_favorite: Boolean(row.is_favorite),
  is_deleted: Boolean(row.is_deleted),
  visit_count: row.visit_count,
  last_visited_at: row.last_visited_at || undefined
});

export class LinksService {
  // Create a new link
  static async createLink(linkData: LinkCreate): Promise<number> {
    try {
      const database = await getDatabase();
      const tagsJson = tagsToJson(linkData.tags);
      
      const result = await database.runAsync(
        `INSERT INTO links (title, url, description, tags, created_at, updated_at) 
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [linkData.title, linkData.url, linkData.description || null, tagsJson]
      );
      
      // Update tag usage counts
      if (linkData.tags && linkData.tags.length > 0) {
        await this.updateTagUsage(linkData.tags);
      }
      
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error creating link:', error);
      throw error;
    }
  }

  // Get all links (not deleted)
  static async getAllLinks(limit?: number, offset?: number): Promise<Link[]> {
    try {
      const database = await getDatabase();
      let query = `
        SELECT id, title, url, description, tags, favicon_url, preview_image_url, 
               created_at, updated_at, is_favorite, is_deleted, visit_count, last_visited_at
        FROM links 
        WHERE is_deleted = 0 
        ORDER BY updated_at DESC
      `;
      
      const params: string[] = [];
      if (limit) {
        query += ' LIMIT ?';
        params.push(limit.toString());
        if (offset) {
          query += ' OFFSET ?';
          params.push(offset.toString());
        }
      }
      
      const rows = await database.getAllAsync(query, params);
      
      return rows.map(row => rowToLink(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting all links:', error);
      throw error;
    }
  }

  // Get link by ID
  static async getLinkById(id: number): Promise<Link | null> {
    try {
      const database = await getDatabase();
      const row = await database.getFirstAsync(
        `SELECT id, title, url, description, tags, favicon_url, preview_image_url,
                created_at, updated_at, is_favorite, is_deleted, visit_count, last_visited_at
         FROM links WHERE id = ? AND is_deleted = 0`,
        [id.toString()]
      );
      
      if (!row) return null;
      
      return rowToLink(row as DatabaseRow);
    } catch (error) {
      console.error('Error getting link by ID:', error);
      throw error;
    }
  }

  // Update link
  static async updateLink(id: number, updates: LinkUpdate): Promise<boolean> {
    try {
      const database = await getDatabase();
      const setClauses: string[] = ['updated_at = datetime(\'now\')'];
      const values: string[] = [];
      
      if (updates.title !== undefined) {
        setClauses.push('title = ?');
        values.push(updates.title);
      }
      
      if (updates.url !== undefined) {
        setClauses.push('url = ?');
        values.push(updates.url);
      }
      
      if (updates.description !== undefined) {
        setClauses.push('description = ?');
        values.push(updates.description || '');
      }
      
      if (updates.tags !== undefined) {
        setClauses.push('tags = ?');
        values.push(tagsToJson(updates.tags));
        await this.updateTagUsage(updates.tags);
      }
      
      if (updates.is_favorite !== undefined) {
        setClauses.push('is_favorite = ?');
        values.push(updates.is_favorite ? '1' : '0');
      }
      
      values.push(id.toString());
      
      const result = await database.runAsync(
        `UPDATE links SET ${setClauses.join(', ')} WHERE id = ? AND is_deleted = 0`,
        values
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating link:', error);
      throw error;
    }
  }

  // Soft delete link
  static async deleteLink(id: number): Promise<boolean> {
    try {
      const database = await getDatabase();
      const result = await database.runAsync(
        'UPDATE links SET is_deleted = 1, updated_at = datetime(\'now\') WHERE id = ?',
        [id.toString()]
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting link:', error);
      throw error;
    }
  }

  // Record a visit to a link
  static async recordVisit(id: number): Promise<boolean> {
    try {
      const database = await getDatabase();
      const result = await database.runAsync(
        `UPDATE links 
         SET visit_count = visit_count + 1, 
             last_visited_at = datetime('now'),
             updated_at = datetime('now')
         WHERE id = ? AND is_deleted = 0`,
        [id.toString()]
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error recording visit:', error);
      throw error;
    }
  }

  // Search links
  static async searchLinks(query: string, limit?: number): Promise<Link[]> {
    try {
      const database = await getDatabase();
      const searchQuery = `%${query.toLowerCase()}%`;
      
      let sql = `
        SELECT id, title, url, description, tags, favicon_url, preview_image_url,
               created_at, updated_at, is_favorite, is_deleted, visit_count, last_visited_at
        FROM links 
        WHERE is_deleted = 0 
        AND (LOWER(title) LIKE ? OR LOWER(url) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ?)
        ORDER BY 
          CASE 
            WHEN LOWER(title) LIKE ? THEN 1
            WHEN LOWER(url) LIKE ? THEN 2
            WHEN LOWER(description) LIKE ? THEN 3
            ELSE 4
          END,
          updated_at DESC
      `;
      
      const params = [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery];
      
      if (limit) {
        sql += ' LIMIT ?';
        params.push(limit.toString());
      }
      
      const rows = await database.getAllAsync(sql, params);
      
      return rows.map(row => rowToLink(row as DatabaseRow));
    } catch (error) {
      console.error('Error searching links:', error);
      throw error;
    }
  }

  // Get favorite links
  static async getFavoriteLinks(): Promise<Link[]> {
    try {
      const database = await getDatabase();
      const rows = await database.getAllAsync(
        `SELECT id, title, url, description, tags, favicon_url, preview_image_url,
                created_at, updated_at, is_favorite, is_deleted, visit_count, last_visited_at
         FROM links 
         WHERE is_deleted = 0 AND is_favorite = 1 
         ORDER BY updated_at DESC`
      );
      
      return rows.map(row => rowToLink(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting favorite links:', error);
      throw error;
    }
  }

  // Get links by tag
  static async getLinksByTag(tag: string): Promise<Link[]> {
    try {
      const database = await getDatabase();
      const rows = await database.getAllAsync(
        `SELECT id, title, url, description, tags, favicon_url, preview_image_url,
                created_at, updated_at, is_favorite, is_deleted, visit_count, last_visited_at
         FROM links 
         WHERE is_deleted = 0 AND tags LIKE ?
         ORDER BY updated_at DESC`,
        [`%"${tag}"%`]
      );
      
      return rows.map(row => rowToLink(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting links by tag:', error);
      throw error;
    }
  }

  // Get recent links
  static async getRecentLinks(limit: number = 10): Promise<Link[]> {
    try {
      const database = await getDatabase();
      const rows = await database.getAllAsync(
        `SELECT id, title, url, description, tags, favicon_url, preview_image_url,
                created_at, updated_at, is_favorite, is_deleted, visit_count, last_visited_at
         FROM links 
         WHERE is_deleted = 0 
         ORDER BY updated_at DESC 
         LIMIT ?`,
        [limit.toString()]
      );
      
      return rows.map(row => rowToLink(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting recent links:', error);
      throw error;
    }
  }

  // Get most visited links
  static async getMostVisitedLinks(limit: number = 10): Promise<Link[]> {
    try {
      const database = await getDatabase();
      const rows = await database.getAllAsync(
        `SELECT id, title, url, description, tags, favicon_url, preview_image_url,
                created_at, updated_at, is_favorite, is_deleted, visit_count, last_visited_at
         FROM links 
         WHERE is_deleted = 0 AND visit_count > 0
         ORDER BY visit_count DESC, updated_at DESC
         LIMIT ?`,
        [limit.toString()]
      );
      
      return rows.map(row => rowToLink(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting most visited links:', error);
      throw error;
    }
  }

  // Toggle favorite status
  static async toggleFavorite(id: number): Promise<boolean> {
    try {
      const database = await getDatabase();
      const result = await database.runAsync(
        `UPDATE links 
         SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END,
             updated_at = datetime('now')
         WHERE id = ? AND is_deleted = 0`,
        [id.toString()]
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  // Update tag usage counts
  private static async updateTagUsage(tags: string[]): Promise<void> {
    try {
      const database = await getDatabase();
      
      for (const tag of tags) {
        await database.runAsync(
          `INSERT INTO tags (name, usage_count, created_at) 
           VALUES (?, 1, datetime('now'))
           ON CONFLICT(name) DO UPDATE SET usage_count = usage_count + 1`,
          [tag.toLowerCase()]
        );
      }
    } catch (error) {
      console.error('Error updating tag usage:', error);
    }
  }

  // Get links count
  static async getLinksCount(): Promise<number> {
    try {
      const database = await getDatabase();
      const result = await database.getFirstAsync(
        'SELECT COUNT(*) as count FROM links WHERE is_deleted = 0'
      );
      
      return (result as any)?.count || 0;
    } catch (error) {
      console.error('Error getting links count:', error);
      return 0;
    }
  }
}
