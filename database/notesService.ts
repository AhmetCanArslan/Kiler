import { Platform } from 'react-native';
import { db } from './database';

export interface Note {
  id?: number;
  title: string;
  content: string;
  tags?: string[];
  word_count?: number;
  created_at?: string;
  updated_at?: string;
  is_favorite?: boolean;
  is_deleted?: boolean;
}

export interface NoteCreate {
  title: string;
  content: string;
  tags?: string[];
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  tags?: string[];
  is_favorite?: boolean;
}

interface DatabaseRow {
  id: number;
  title: string;
  content: string;
  tags: string;
  word_count: number;
  created_at: string;
  updated_at: string;
  is_favorite: number;
  is_deleted: number;
}

// Helper function to calculate word count
const calculateWordCount = (content: string): number => {
  return content.trim().split(/\s+/).filter(word => word.length > 0).length;
};

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

// Helper function to convert database row to Note
const rowToNote = (row: DatabaseRow): Note => ({
  id: row.id,
  title: row.title,
  content: row.content,
  tags: jsonToTags(row.tags),
  word_count: row.word_count,
  created_at: row.created_at,
  updated_at: row.updated_at,
  is_favorite: Boolean(row.is_favorite),
  is_deleted: Boolean(row.is_deleted)
});

export class NotesService {
  // Create a new note
  static async createNote(noteData: NoteCreate): Promise<number> {
    try {
      const database = await getDatabase();
      const wordCount = calculateWordCount(noteData.content);
      const tagsJson = tagsToJson(noteData.tags);
      
      const result = await database.runAsync(
        `INSERT INTO notes (title, content, tags, word_count, created_at, updated_at) 
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [noteData.title, noteData.content, tagsJson, wordCount.toString()]
      );
      
      // Update tag usage counts
      if (noteData.tags && noteData.tags.length > 0) {
        await this.updateTagUsage(noteData.tags);
      }
      
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  // Get all notes (not deleted)
  static async getAllNotes(limit?: number, offset?: number): Promise<Note[]> {
    try {
      const database = await getDatabase();
      let query = `
        SELECT id, title, content, tags, word_count, created_at, updated_at, is_favorite, is_deleted
        FROM notes 
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
      
      return rows.map(row => rowToNote(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting all notes:', error);
      throw error;
    }
  }

  // Get note by ID
  static async getNoteById(id: number): Promise<Note | null> {
    try {
      const database = await getDatabase();
      const row = await database.getFirstAsync(
        `SELECT id, title, content, tags, word_count, created_at, updated_at, is_favorite, is_deleted
         FROM notes WHERE id = ? AND is_deleted = 0`,
        [id.toString()]
      );
      
      if (!row) return null;
      
      return rowToNote(row as DatabaseRow);
    } catch (error) {
      console.error('Error getting note by ID:', error);
      throw error;
    }
  }

  // Update note
  static async updateNote(id: number, updates: NoteUpdate): Promise<boolean> {
    try {
      const database = await getDatabase();
      const setClauses: string[] = ['updated_at = datetime(\'now\')'];
      const values: string[] = [];
      
      if (updates.title !== undefined) {
        setClauses.push('title = ?');
        values.push(updates.title);
      }
      
      if (updates.content !== undefined) {
        setClauses.push('content = ?', 'word_count = ?');
        values.push(updates.content, calculateWordCount(updates.content).toString());
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
        `UPDATE notes SET ${setClauses.join(', ')} WHERE id = ? AND is_deleted = 0`,
        values
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  // Soft delete note
  static async deleteNote(id: number): Promise<boolean> {
    try {
      const database = await getDatabase();
      const result = await database.runAsync(
        'UPDATE notes SET is_deleted = 1, updated_at = datetime(\'now\') WHERE id = ?',
        [id.toString()]
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  // Permanently delete note
  static async permanentlyDeleteNote(id: number): Promise<boolean> {
    try {
      const database = await getDatabase();
      const result = await database.runAsync('DELETE FROM notes WHERE id = ?', [id.toString()]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error permanently deleting note:', error);
      throw error;
    }
  }

  // Search notes
  static async searchNotes(query: string, limit?: number): Promise<Note[]> {
    try {
      const database = await getDatabase();
      const searchQuery = `%${query.toLowerCase()}%`;
      
      let sql = `
        SELECT id, title, content, tags, word_count, created_at, updated_at, is_favorite, is_deleted
        FROM notes 
        WHERE is_deleted = 0 
        AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(tags) LIKE ?)
        ORDER BY 
          CASE 
            WHEN LOWER(title) LIKE ? THEN 1
            WHEN LOWER(content) LIKE ? THEN 2
            ELSE 3
          END,
          updated_at DESC
      `;
      
      const params = [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery];
      
      if (limit) {
        sql += ' LIMIT ?';
        params.push(limit.toString());
      }
      
      const rows = await database.getAllAsync(sql, params);
      
      return rows.map(row => rowToNote(row as DatabaseRow));
    } catch (error) {
      console.error('Error searching notes:', error);
      throw error;
    }
  }

  // Get favorite notes
  static async getFavoriteNotes(): Promise<Note[]> {
    try {
      const database = await getDatabase();
      const rows = await database.getAllAsync(
        `SELECT id, title, content, tags, word_count, created_at, updated_at, is_favorite, is_deleted
         FROM notes 
         WHERE is_deleted = 0 AND is_favorite = 1 
         ORDER BY updated_at DESC`
      );
      
      return rows.map(row => rowToNote(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting favorite notes:', error);
      throw error;
    }
  }

  // Get notes by tag
  static async getNotesByTag(tag: string): Promise<Note[]> {
    try {
      const database = await getDatabase();
      const rows = await database.getAllAsync(
        `SELECT id, title, content, tags, word_count, created_at, updated_at, is_favorite, is_deleted
         FROM notes 
         WHERE is_deleted = 0 AND tags LIKE ?
         ORDER BY updated_at DESC`,
        [`%"${tag}"%`]
      );
      
      return rows.map(row => rowToNote(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting notes by tag:', error);
      throw error;
    }
  }

  // Get recent notes
  static async getRecentNotes(limit: number = 10): Promise<Note[]> {
    try {
      const database = await getDatabase();
      const rows = await database.getAllAsync(
        `SELECT id, title, content, tags, word_count, created_at, updated_at, is_favorite, is_deleted
         FROM notes 
         WHERE is_deleted = 0 
         ORDER BY updated_at DESC 
         LIMIT ?`,
        [limit.toString()]
      );
      
      return rows.map(row => rowToNote(row as DatabaseRow));
    } catch (error) {
      console.error('Error getting recent notes:', error);
      throw error;
    }
  }

  // Toggle favorite status
  static async toggleFavorite(id: number): Promise<boolean> {
    try {
      const database = await getDatabase();
      const result = await database.runAsync(
        `UPDATE notes 
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

  // Get notes count
  static async getNotesCount(): Promise<number> {
    try {
      const database = await getDatabase();
      const result = await database.getFirstAsync(
        'SELECT COUNT(*) as count FROM notes WHERE is_deleted = 0'
      );
      
      return (result as any)?.count || 0;
    } catch (error) {
      console.error('Error getting notes count:', error);
      return 0;
    }
  }
}
