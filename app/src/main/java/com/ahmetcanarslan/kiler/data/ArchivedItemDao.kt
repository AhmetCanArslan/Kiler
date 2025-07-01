package com.ahmetcanarslan.kiler.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ArchivedItemDao {
    
    @Query("SELECT * FROM archived_items ORDER BY savedTimestamp DESC")
    fun getAllItems(): Flow<List<ArchivedItem>>
    
    @Query("""
        SELECT * FROM archived_items 
        WHERE (contentData LIKE '%' || :searchQuery || '%' 
               OR sourceApplication LIKE '%' || :searchQuery || '%'
               OR contentPreviewTitle LIKE '%' || :searchQuery || '%')
        AND savedTimestamp >= :fromTimestamp
        ORDER BY savedTimestamp DESC
    """)
    fun searchItems(searchQuery: String, fromTimestamp: Long): Flow<List<ArchivedItem>>
    
    @Insert
    suspend fun insertItem(item: ArchivedItem)
    
    @Delete
    suspend fun deleteItem(item: ArchivedItem)
    
    @Query("SELECT * FROM archived_items")
    suspend fun getAllItemsForExport(): List<ArchivedItem>
}
