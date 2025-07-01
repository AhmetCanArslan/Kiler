package com.ahmetcanarslan.kiler.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [ArchivedItem::class, DeletedItem::class],
    version = 4
)
@TypeConverters(Converters::class)
abstract class KilerDatabase : RoomDatabase() {
    
    abstract fun archivedItemDao(): ArchivedItemDao
    abstract fun deletedItemDao(): DeletedItemDao

    companion object {
        @Volatile
        private var INSTANCE: KilerDatabase? = null
        
        fun getDatabase(context: Context): KilerDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    KilerDatabase::class.java,
                    "kiler_database"
                )
                .fallbackToDestructiveMigration() // Migration yoksa veritabanını sıfırla
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
