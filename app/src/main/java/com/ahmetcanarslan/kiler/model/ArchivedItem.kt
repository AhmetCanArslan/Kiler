package com.ahmetcanarslan.kiler.model

import com.ahmetcanarslan.kiler.data.ContentType
import kotlinx.serialization.Serializable

@Serializable
data class ArchivedItem(
    val id: Int = 0,
    val contentType: ContentType,
    val contentData: String,
    val contentPreviewTitle: String? = null,
    val contentPreviewImage: String? = null,
    val savedTimestamp: Long
)