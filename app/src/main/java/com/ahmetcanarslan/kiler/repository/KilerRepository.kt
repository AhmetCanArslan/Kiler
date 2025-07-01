package com.ahmetcanarslan.kiler.repository

import com.ahmetcanarslan.kiler.data.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext
import org.jsoup.Jsoup
import java.util.*

class KilerRepository(
    private val archivedItemDao: ArchivedItemDao,
    private val deletedItemDao: DeletedItemDao
) {
    fun getAllItems(): Flow<List<ArchivedItem>> = archivedItemDao.getAllItems()

    fun searchItems(query: String, fromTimestamp: Long): Flow<List<ArchivedItem>> {
        return archivedItemDao.searchItems(query, fromTimestamp)
    }

    suspend fun insertItem(item: ArchivedItem) {
        withContext(Dispatchers.IO) {
            archivedItemDao.insertItem(item)
        }
    }

    suspend fun deleteArchivedItem(item: ArchivedItem) {
        withContext(Dispatchers.IO) {
            val deletedItem = DeletedItem(
                contentType = item.contentType.name,
                contentData = item.contentData,
                contentPreviewTitle = item.contentPreviewTitle,
                contentPreviewImage = item.contentPreviewImage,
                sourceApplication = item.sourceApplication,
                savedTimestamp = item.savedTimestamp, // Pass original timestamp
                deletedTimestamp = System.currentTimeMillis()
            )
            archivedItemDao.deleteItem(item)
            deletedItemDao.insertDeletedItem(deletedItem)
        }
    }

    suspend fun restoreDeletedItem(item: DeletedItem) {
        withContext(Dispatchers.IO) {
            val restoredItem = ArchivedItem(
                contentType = ContentType.valueOf(item.contentType),
                contentData = item.contentData,
                contentPreviewTitle = item.contentPreviewTitle,
                contentPreviewImage = item.contentPreviewImage,
                sourceApplication = item.sourceApplication,
                savedTimestamp = item.savedTimestamp // Restore with original timestamp
            )
            archivedItemDao.insertItem(restoredItem)
            deletedItemDao.delete(item)
        }
    }

    suspend fun deleteDeletedItemPermanently(item: DeletedItem) {
        withContext(Dispatchers.IO) {
            deletedItemDao.deleteById(item.id)
        }
    }

    suspend fun getAllItemsForExport(): List<ArchivedItem> {
        return withContext(Dispatchers.IO) {
            archivedItemDao.getAllItemsForExport()
        }
    }

    suspend fun fetchWebPreview(url: String): Pair<String?, String?> {
        return withContext(Dispatchers.IO) {
            try {
                val doc = Jsoup.connect(url).get()
                val title = doc.title().takeIf { it.isNotBlank() }
                val ogImage = doc.selectFirst("meta[property=og:image]")?.attr("content")
                    ?.takeIf { it.isNotBlank() }
                Pair(title, ogImage)
            } catch (e: Exception) {
                Pair(null, null)
            }
        }
    }

    fun getDeletedItems(): Flow<List<DeletedItem>> = flow {
        emit(withContext(Dispatchers.IO) { deletedItemDao.getAllDeletedItems() })
    }
}
