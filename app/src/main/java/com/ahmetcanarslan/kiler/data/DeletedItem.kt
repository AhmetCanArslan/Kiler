package com.ahmetcanarslan.kiler.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "deleted_items")
data class DeletedItem(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val contentType: String,
    val contentData: String,
    val contentPreviewTitle: String?,
    val contentPreviewImage: String?,
    val sourceApplication: String?,
    val savedTimestamp: Long,
    val deletedTimestamp: Long
) {
    fun toArchivedItem(): ArchivedItem {
        return ArchivedItem(
            id = 0, // Let Room auto-generate a new ID
            contentType = ContentType.valueOf(this.contentType),
            contentData = this.contentData,
            contentPreviewTitle = this.contentPreviewTitle,
            contentPreviewImage = this.contentPreviewImage,
            sourceApplication = this.sourceApplication,
            savedTimestamp = this.savedTimestamp
        )
    }

    companion object {
        fun fromArchivedItem(item: ArchivedItem): DeletedItem {
            return DeletedItem(
                contentType = item.contentType.name,
                contentData = item.contentData,
                contentPreviewTitle = item.contentPreviewTitle,
                contentPreviewImage = item.contentPreviewImage,
                sourceApplication = item.sourceApplication,
                savedTimestamp = item.savedTimestamp,
                deletedTimestamp = System.currentTimeMillis()
            )
        }
    }
}
