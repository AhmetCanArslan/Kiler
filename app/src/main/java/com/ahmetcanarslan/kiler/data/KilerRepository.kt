package com.ahmetcanarslan.kiler.data

import com.ahmetcanarslan.kiler.data.ArchivedItem
import com.ahmetcanarslan.kiler.data.ArchivedItemDao
import com.ahmetcanarslan.kiler.data.DeletedItem
import com.ahmetcanarslan.kiler.data.DeletedItemDao

class KilerRepository(
    private val archivedItemDao: ArchivedItemDao,
    private val deletedItemDao: DeletedItemDao
) {
    // ...existing code...

    suspend fun deleteDeletedItem(item: DeletedItem) {
        deletedItemDao.delete(item)
    }

    // ...existing code...
}