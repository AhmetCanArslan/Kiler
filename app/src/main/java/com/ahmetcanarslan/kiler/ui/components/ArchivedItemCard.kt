package com.ahmetcanarslan.kiler.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.ahmetcanarslan.kiler.data.ArchivedItem
import com.ahmetcanarslan.kiler.data.ContentType
import com.ahmetcanarslan.kiler.ui.theme.KilerTheme
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArchivedItemCard(
    item: ArchivedItem,
    onDeleteClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable {
                if (item.contentType == ContentType.LINK) {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(item.contentData))
                    context.startActivity(intent)
                }
            }
    ) {
        Column {
            // Header with delete button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.End
            ) {
                IconButton(onClick = onDeleteClick) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Delete item"
                    )
                }
            }
            
            // Content based on type
            when (item.contentType) {
                ContentType.TEXT -> {
                    Text(
                        text = item.contentData,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                
                ContentType.IMAGE_URI -> {
                    AsyncImage(
                        model = item.contentData,
                        contentDescription = "Archived image",
                        modifier = Modifier
                            .fillMaxWidth()
                            .wrapContentHeight(),
                        contentScale = ContentScale.Fit
                    )
                }
                
                ContentType.LINK -> {
                    Column {
                        item.contentPreviewImage?.let { imageUrl ->
                            AsyncImage(
                                model = imageUrl,
                                contentDescription = "Link preview",
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .aspectRatio(16f / 9f),
                                contentScale = ContentScale.Crop
                            )
                        }
                        
                        item.contentPreviewTitle?.let { title ->
                            Text(
                                text = title,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 8.dp),
                                style = MaterialTheme.typography.titleMedium,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        
                        Text(
                            text = item.contentData,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
            
            // Footer
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
                            .format(Date(item.savedTimestamp)),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = item.sourceApplication,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                Row {
                    IconButton(
                        onClick = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("Kiler Content", item.contentData)
                            clipboard.setPrimaryClip(clip)
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.ContentCopy,
                            contentDescription = "Copy content"
                        )
                    }
                    
                    IconButton(
                        onClick = {
                            val intent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_TEXT, item.contentData)
                            }
                            context.startActivity(Intent.createChooser(intent, "Share"))
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "Share content"
                        )
                    }
                }
            }
        }
    }
}

@Preview
@Composable
fun ArchivedItemCardPreview() {
    KilerTheme {
        ArchivedItemCard(
            item = ArchivedItem(
                id = 1,
                contentType = ContentType.TEXT,
                contentData = "This is a sample text content that was archived from another application.",
                sourceApplication = "WhatsApp",
                savedTimestamp = System.currentTimeMillis()
            ),
            onDeleteClick = {}
        )
    }
}
