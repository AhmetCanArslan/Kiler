package com.ahmetcanarslan.kiler.repository

import com.ahmetcanarslan.kiler.data.ArchivedItem
import com.ahmetcanarslan.kiler.data.ArchivedItemDao
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import org.jsoup.Jsoup
import java.util.*

class KilerRepository(private val dao: ArchivedItemDao) {
    
    fun getAllItems(): Flow<List<ArchivedItem>> = dao.getAllItems()
    
    fun searchItems(query: String, fromTimestamp: Long): Flow<List<ArchivedItem>> {
        return dao.searchItems(query, fromTimestamp)
    }
    
    suspend fun insertItem(item: ArchivedItem) {
        withContext(Dispatchers.IO) {
            dao.insertItem(item)
        }
    }
    
    suspend fun deleteItem(item: ArchivedItem) {
        withContext(Dispatchers.IO) {
            dao.deleteItem(item)
        }
    }
    
    suspend fun getAllItemsForExport(): List<ArchivedItem> {
        return withContext(Dispatchers.IO) {
            dao.getAllItemsForExport()
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
}
