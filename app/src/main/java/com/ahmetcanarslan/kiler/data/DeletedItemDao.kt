package com.ahmetcanarslan.kiler.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query

@Dao
interface DeletedItemDao {
    @Insert
    suspend fun insertDeletedItem(item: DeletedItem)

    @Query("SELECT * FROM deleted_items ORDER BY deletedTimestamp DESC")
    suspend fun getAllDeletedItems(): List<DeletedItem>

    @Delete
    suspend fun delete(item: DeletedItem)

    @Query("DELETE FROM deleted_items WHERE id = :itemId")
    suspend fun deleteById(itemId: Int)
}
