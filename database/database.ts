import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Database configuration
const DATABASE_NAME = 'kiler.db';
const DATABASE_VERSION = 1;

// Open database only on native platforms
export const db = Platform.OS !== 'web' ? SQLite.openDatabaseAsync(DATABASE_NAME) : null;

// Initialize database with tables
export const initializeDatabase = async () => {
  // Skip database initialization on web platform
  if (Platform.OS === 'web') {
    console.log('Database initialization skipped on web platform');
    return;
  }

  try {
    const database = await db;
    if (!database) {
      throw new Error('Database not available');
    }
    
    // Enable foreign keys
    await database.execAsync('PRAGMA foreign_keys = ON;');
    
    // Create tables
    await createTables(database);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Create all tables
const createTables = async (database: SQLite.SQLiteDatabase) => {
  // Notes table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT, -- JSON string of tags array
      word_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_favorite INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0
    );
  `);

  // Links table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      tags TEXT, -- JSON string of tags array
      favicon_url TEXT,
      preview_image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_favorite INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      visit_count INTEGER DEFAULT 0,
      last_visited_at DATETIME
    );
  `);

  // Photos table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      file_path TEXT NOT NULL, -- Local file path
      original_name TEXT,
      file_size INTEGER,
      width INTEGER,
      height INTEGER,
      mime_type TEXT,
      tags TEXT, -- JSON string of tags array
      location_latitude REAL,
      location_longitude REAL,
      location_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      taken_at DATETIME,
      is_favorite INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0
    );
  `);

  // Tags table (for better tag management and search)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT, -- Hex color for tag
      usage_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Collections table (for organizing items)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT, -- Hex color for collection
      icon TEXT, -- Icon name
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0
    );
  `);

  // Collection items table (many-to-many relationship)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS collection_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id INTEGER NOT NULL,
      item_type TEXT NOT NULL, -- 'note', 'link', 'photo'
      item_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (collection_id) REFERENCES collections (id) ON DELETE CASCADE,
      UNIQUE(collection_id, item_type, item_id)
    );
  `);

  // Search history table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      result_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // App settings table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for better performance
  await createIndexes(database);
};

// Create indexes for better query performance
const createIndexes = async (database: SQLite.SQLiteDatabase) => {
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes (updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notes_is_deleted ON notes (is_deleted);
    CREATE INDEX IF NOT EXISTS idx_notes_is_favorite ON notes (is_favorite);
    
    CREATE INDEX IF NOT EXISTS idx_links_created_at ON links (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_links_updated_at ON links (updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_links_is_deleted ON links (is_deleted);
    CREATE INDEX IF NOT EXISTS idx_links_is_favorite ON links (is_favorite);
    
    CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_photos_updated_at ON photos (updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_photos_is_deleted ON photos (is_deleted);
    CREATE INDEX IF NOT EXISTS idx_photos_is_favorite ON photos (is_favorite);
    CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos (taken_at DESC);
    
    CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name);
    CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags (usage_count DESC);
    
    CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items (collection_id);
    CREATE INDEX IF NOT EXISTS idx_collection_items_type_id ON collection_items (item_type, item_id);
    
    CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history (query);
    CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history (created_at DESC);
  `);
};

// Drop all tables (for development/testing)
export const dropAllTables = async () => {
  // Skip on web platform
  if (Platform.OS === 'web') {
    console.log('Drop tables skipped on web platform');
    return;
  }

  try {
    const database = await db;
    if (!database) {
      throw new Error('Database not available');
    }
    
    await database.execAsync(`
      DROP TABLE IF EXISTS collection_items;
      DROP TABLE IF EXISTS collections;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS photos;
      DROP TABLE IF EXISTS links;
      DROP TABLE IF EXISTS notes;
      DROP TABLE IF EXISTS search_history;
      DROP TABLE IF EXISTS app_settings;
    `);
    
    console.log('All tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error;
  }
};

// Get database stats
export const getDatabaseStats = async () => {
  // Return empty stats on web platform
  if (Platform.OS === 'web') {
    return {
      notes_count: 0,
      links_count: 0,
      photos_count: 0,
      tags_count: 0,
      collections_count: 0,
    };
  }

  try {
    const database = await db;
    if (!database) {
      throw new Error('Database not available');
    }
    
    const stats = await database.getAllAsync(`
      SELECT 
        (SELECT COUNT(*) FROM notes WHERE is_deleted = 0) as notes_count,
        (SELECT COUNT(*) FROM links WHERE is_deleted = 0) as links_count,
        (SELECT COUNT(*) FROM photos WHERE is_deleted = 0) as photos_count,
        (SELECT COUNT(*) FROM tags) as tags_count,
        (SELECT COUNT(*) FROM collections WHERE is_deleted = 0) as collections_count
    `);
    
    return stats[0];
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
};

// Close database connection
export const closeDatabase = async () => {
  // Skip on web platform
  if (Platform.OS === 'web') {
    console.log('Database close skipped on web platform');
    return;
  }

  try {
    const database = await db;
    if (!database) {
      console.log('Database not available to close');
      return;
    }
    await database.closeAsync();
    console.log('Database closed successfully');
  } catch (error) {
    console.error('Error closing database:', error);
  }
};
