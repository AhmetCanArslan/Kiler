package com.ahmetcanarslan.kiler.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Entity(tableName = "archived_items")
@Serializable
data class ArchivedItem(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val contentType: ContentType,
    val contentData: String,
    val contentPreviewTitle: String? = null,
    val contentPreviewImage: String? = null,
    val sourceApplication: String,
    val savedTimestamp: Long
)
