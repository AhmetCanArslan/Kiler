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
    val sourceApplication: String,
    val deletedTimestamp: Long
)
