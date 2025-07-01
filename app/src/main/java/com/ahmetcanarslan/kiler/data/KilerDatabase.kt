package com.ahmetcanarslan.kiler.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [ArchivedItem::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class KilerDatabase : RoomDatabase() {
    
    abstract fun archivedItemDao(): ArchivedItemDao
    
    companion object {
        @Volatile
        private var INSTANCE: KilerDatabase? = null
        
        fun getDatabase(context: Context): KilerDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    KilerDatabase::class.java,
                    "kiler_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
