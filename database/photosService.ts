import { Platform } from 'react-native';
import { db } from './database';

export interface Photo {
  id?: number;
  title: string;
  description?: string;
  file_path: string;
  original_name?: string;
  file_size?: number;
  width?: number;
  height?: number;
  mime_type?: string;
  tags?: string[];
  location_latitude?: number;
  location_longitude?: number;
  location_name?: string;
  created_at?: string;
  updated_at?: string;
  taken_at?: string;
  is_favorite?: boolean;
  is_deleted?: boolean;
}

export interface PhotoCreate {
  title: string;
  description?: string;
  file_path: string;
  original_name?: string;
  file_size?: number;
  width?: number;
  height?: number;
  mime_type?: string;
  tags?: string[];
  location_latitude?: number;
  location_longitude?: number;
  location_name?: string;
  taken_at?: string;
}

export interface PhotoUpdate {
  title?: string;
  description?: string;
  tags?: string[];
  location_name?: string;
  is_favorite?: boolean;
}

interface DatabaseRow {
  id: number;
  title: string;
  description: string | null;
  file_path: string;
  original_name: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  mime_type: string | null;
  tags: string;
  location_latitude: number | null;
  location_longitude: number | null;
  location_name: string | null;
  created_at: string;
  updated_at: string;
  taken_at: string | null;
  is_favorite: number;
  is_deleted: number;
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

// Helper function to convert database row to Photo
const rowToPhoto = (row: DatabaseRow): Photo => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  file_path: row.file_path,
  original_name: row.original_name || undefined,
  file_size: row.file_size || undefined,
  width: row.width || undefined,
  height: row.height || undefined,
  mime_type: row.mime_type || undefined,
  tags: jsonToTags(row.tags),
  location_latitude: row.location_latitude || undefined,
  location_longitude: row.location_longitude || undefined,
  location_name: row.location_name || undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
  taken_at: row.taken_at || undefined,
  is_favorite: Boolean(row.is_favorite),
  is_deleted: Boolean(row.is_deleted)
});

export class PhotosService {
  // Create a new photo
  static async createPhoto(photoData: PhotoCreate): Promise<number> {
    try {
      const database = await getDatabase();
      const tagsJson = tagsToJson(photoData.tags);
      
      const result = await database.runAsync(
        `INSERT INTO photos (
          title, description, file_path, original_name, file_size, width, height, mime_type,
          tags, location_latitude, location_longitude, location_name, taken_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          photoData.title,
          photoData.description || null,
          photoData.file_path,
          photoData.original_name || null,
          photoData.file_size?.toString() || null,
          photoData.width?.toString() || null,
          photoData.height?.toString() || null,
          photoData.mime_type || null,
          tagsJson,
          photoData.location_latitude?.toString() || null,
          photoData.location_longitude?.toString() || null,
          photoData.location_name || null,
          photoData.taken_at || null
        ]
      );
      
      // Update tag usage counts
      if (photoData.tags && photoData.tags.length > 0) {
        await this.updateTagUsage(photoData.tags);
      }
      
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error creating photo:', error);
      throw error;
    }
  }

  // Get all photos (not deleted)
  static async getAllPhotos(limit?: number, offset?: number): Promise<Photo[]> {
    try {
      const database = await getDatabase();
      let query = `
        SELECT id, title, description, file_path, original_name, file_size, width, height, mime_type,
               tags, location_latitude, location_longitude, location_name, 
               created_at, updated_at, taken_at, is_favorite, is_deleted
        FROM photos 
        WHERE is_deleted = 0 
        ORDER BY COALESCE(taken_at, created_at) DESC
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
      
      return rows.map(row => rowToPhoto(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting all photos:', error);
      throw error;
    }
  }

  // Get photo by ID
  static async getPhotoById(id: number): Promise<Photo | null> {
    try {
      const database = await getDatabase();
      const row = await database.getFirstAsync(
        `SELECT id, title, description, file_path, original_name, file_size, width, height, mime_type,
                tags, location_latitude, location_longitude, location_name,
                created_at, updated_at, taken_at, is_favorite, is_deleted
         FROM photos WHERE id = ? AND is_deleted = 0`,
        [id.toString()]
      );
      
      if (!row) return null;
      
      return rowToPhoto(row as DatabaseRow);
    } catch (error) {
      console.error('Error getting photo by ID:', error);
      throw error;
    }
  }

  // Update photo
  static async updatePhoto(id: number, updates: PhotoUpdate): Promise<boolean> {
    try {
      const database = await getDatabase();
      const setClauses: string[] = ['updated_at = datetime(\'now\')'];
      const values: string[] = [];
      
      if (updates.title !== undefined) {
        setClauses.push('title = ?');
        values.push(updates.title);
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
      
      if (updates.location_name !== undefined) {
        setClauses.push('location_name = ?');
        values.push(updates.location_name || '');
      }
      
      if (updates.is_favorite !== undefined) {
        setClauses.push('is_favorite = ?');
        values.push(updates.is_favorite ? '1' : '0');
      }
      
      values.push(id.toString());
      
      const result = await database.runAsync(
        `UPDATE photos SET ${setClauses.join(', ')} WHERE id = ? AND is_deleted = 0`,
        values
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating photo:', error);
      throw error;
    }
  }

  // Soft delete photo
  static async deletePhoto(id: number): Promise<boolean> {
    try {
      const database = await getDatabase();
      const result = await database.runAsync(
        'UPDATE photos SET is_deleted = 1, updated_at = datetime(\'now\') WHERE id = ?',
        [id.toString()]
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  // Search photos
  static async searchPhotos(query: string, limit?: number): Promise<Photo[]> {
    try {
      const database = await getDatabase();
      const searchQuery = `%${query.toLowerCase()}%`;
      
      let sql = `
        SELECT id, title, description, file_path, original_name, file_size, width, height, mime_type,
               tags, location_latitude, location_longitude, location_name,
               created_at, updated_at, taken_at, is_favorite, is_deleted
        FROM photos 
        WHERE is_deleted = 0 
        AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ? OR LOWER(location_name) LIKE ?)
        ORDER BY 
          CASE 
            WHEN LOWER(title) LIKE ? THEN 1
            WHEN LOWER(description) LIKE ? THEN 2
            WHEN LOWER(location_name) LIKE ? THEN 3
            ELSE 4
          END,
          COALESCE(taken_at, created_at) DESC
      `;
      
      const params = [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery];
      
      if (limit) {
        sql += ' LIMIT ?';
        params.push(limit.toString());
      }
      
      const rows = await database.getAllAsync(sql, params);
      
      return rows.map(row => rowToPhoto(row as DatabaseRow));
    } catch (error) {
      console.error('Error searching photos:', error);
      throw error;
    }
  }

  // Get favorite photos
  static async getFavoritePhotos(): Promise<Photo[]> {
    try {
      const database = await getDatabase();
      const rows = await database.getAllAsync(
        `SELECT id, title, description, file_path, original_name, file_size, width, height, mime_type,
                tags, location_latitude, location_longitude, location_name,
                created_at, updated_at, taken_at, is_favorite, is_deleted
         FROM photos 
         WHERE is_deleted = 0 AND is_favorite = 1 
         ORDER BY COALESCE(taken_at, created_at) DESC`
      );
      
      return rows.map(row => rowToPhoto(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting favorite photos:', error);
      throw error;
    }
  }

  // Get photos by tag
  static async getPhotosByTag(tag: string): Promise<Photo[]> {
    try {
      const database = await getDatabase();
      const rows = await database.getAllAsync(
        `SELECT id, title, description, file_path, original_name, file_size, width, height, mime_type,
                tags, location_latitude, location_longitude, location_name,
                created_at, updated_at, taken_at, is_favorite, is_deleted
         FROM photos 
         WHERE is_deleted = 0 AND tags LIKE ?
         ORDER BY COALESCE(taken_at, created_at) DESC`,
        [`%"${tag}"%`]
      );
      
      return rows.map(row => rowToPhoto(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting photos by tag:', error);
      throw error;
    }
  }

  // Get photos by date range
  static async getPhotosByDateRange(startDate: string, endDate: string): Promise<Photo[]> {
    try {
      const database = await getDatabase();
      const rows = await database.getAllAsync(
        `SELECT id, title, description, file_path, original_name, file_size, width, height, mime_type,
                tags, location_latitude, location_longitude, location_name,
                created_at, updated_at, taken_at, is_favorite, is_deleted
         FROM photos 
         WHERE is_deleted = 0 
         AND (COALESCE(taken_at, created_at) BETWEEN ? AND ?)
         ORDER BY COALESCE(taken_at, created_at) DESC`,
        [startDate, endDate]
      );
      
      return rows.map(row => rowToPhoto(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting photos by date range:', error);
      throw error;
    }
  }

  // Get photos by location
  static async getPhotosByLocation(locationName: string): Promise<Photo[]> {
    try {
      const database = await getDatabase();
      const rows = await database.getAllAsync(
        `SELECT id, title, description, file_path, original_name, file_size, width, height, mime_type,
                tags, location_latitude, location_longitude, location_name,
                created_at, updated_at, taken_at, is_favorite, is_deleted
         FROM photos 
         WHERE is_deleted = 0 AND LOWER(location_name) LIKE ?
         ORDER BY COALESCE(taken_at, created_at) DESC`,
        [`%${locationName.toLowerCase()}%`]
      );
      
      return rows.map(row => rowToPhoto(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting photos by location:', error);
      throw error;
    }
  }

  // Get recent photos
  static async getRecentPhotos(limit: number = 10): Promise<Photo[]> {
    try {
      const database = await getDatabase();
      const rows = await database.getAllAsync(
        `SELECT id, title, description, file_path, original_name, file_size, width, height, mime_type,
                tags, location_latitude, location_longitude, location_name,
                created_at, updated_at, taken_at, is_favorite, is_deleted
         FROM photos 
         WHERE is_deleted = 0 
         ORDER BY COALESCE(taken_at, created_at) DESC 
         LIMIT ?`,
        [limit.toString()]
      );
      
      return rows.map(row => rowToPhoto(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting recent photos:', error);
      throw error;
    }
  }

  // Toggle favorite status
  static async toggleFavorite(id: number): Promise<boolean> {
    try {
      const database = await getDatabase();
      const result = await database.runAsync(
        `UPDATE photos 
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

  // Get photos count
  static async getPhotosCount(): Promise<number> {
    try {
      const database = await getDatabase();
      const result = await database.getFirstAsync(
        'SELECT COUNT(*) as count FROM photos WHERE is_deleted = 0'
      );
      
      return (result as any)?.count || 0;
    } catch (error) {
      console.error('Error getting photos count:', error);
      return 0;
    }
  }

  // Get total file size of all photos
  static async getTotalFileSize(): Promise<number> {
    try {
      const database = await getDatabase();
      const result = await database.getFirstAsync(
        'SELECT COALESCE(SUM(file_size), 0) as total_size FROM photos WHERE is_deleted = 0'
      );
      
      return (result as any)?.total_size || 0;
    } catch (error) {
      console.error('Error getting total file size:', error);
      return 0;
    }
  }
}
