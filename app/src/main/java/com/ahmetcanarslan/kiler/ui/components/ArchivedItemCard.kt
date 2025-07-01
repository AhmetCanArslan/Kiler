package com.ahmetcanarslan.kiler.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.FileProvider
import coil.compose.AsyncImage
import com.ahmetcanarslan.kiler.data.ArchivedItem
import com.ahmetcanarslan.kiler.data.ContentType
import com.ahmetcanarslan.kiler.ui.theme.KilerTheme
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArchivedItemCard(
    item: ArchivedItem,
    onDeleteClick: () -> Unit,
    onEditClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showFullScreenImage by remember { mutableStateOf(false) }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Item") },
            text = { Text("Are you sure you want to move this item to the trash?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onDeleteClick()
                        showDeleteDialog = false
                    }
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (showFullScreenImage && item.contentType == ContentType.IMAGE_URI) {
        Dialog(
            onDismissRequest = { showFullScreenImage = false },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black)
                    .pointerInput(Unit) {
                        detectTapGestures(
                            onDoubleTap = { showFullScreenImage = false }
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                AsyncImage(
                    model = item.contentData,
                    contentDescription = "Full Screen Image",
                    modifier = Modifier.fillMaxWidth(),
                    contentScale = ContentScale.Fit
                )
            }
            BackHandler { showFullScreenImage = false }
        }
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable {
                when (item.contentType) {
                    ContentType.LINK -> {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(item.contentData))
                        context.startActivity(intent)
                    }
                    ContentType.IMAGE_URI -> {
                        showFullScreenImage = true
                    }
                    else -> Unit
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

            }
            
            // Content based on type
            when (item.contentType) {
                ContentType.LINK -> {
                    item.contentPreviewImage?.let { imageUrl ->
                        AsyncImage(
                            model = imageUrl,
                            contentDescription = "Preview Image",
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(180.dp),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    item.contentPreviewTitle?.let {
                        Text(
                            text = it,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            style = MaterialTheme.typography.titleMedium,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                        Spacer(modifier = Modifier.height(4.dp))
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
                ContentType.IMAGE_URI -> {
                    AsyncImage(
                        model = item.contentData,
                        contentDescription = "Archived Image",
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 180.dp),
                        contentScale = ContentScale.Crop
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
                ContentType.TEXT -> {
                    Text(
                        text = item.contentData,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            item.note?.takeIf { it.isNotBlank() }?.let { note ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Note: $note",
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
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
                }
                
                Row {
                    IconButton(onClick = onEditClick) {
                        Icon(
                            Icons.Default.Edit,
                            contentDescription = "Edit Note"
                        )
                    }
                    IconButton(onClick = { showDeleteDialog = true }) {
                        Icon(
                            Icons.Filled.Delete,
                            contentDescription = "Delete"
                        )
                    }
                    IconButton(
                        onClick = {
                            val sendIntent: Intent = Intent().apply {
                                action = Intent.ACTION_SEND
                                when (item.contentType) {
                                    ContentType.LINK, ContentType.TEXT -> {
                                        putExtra(Intent.EXTRA_TEXT, item.contentData)
                                        type = "text/plain"
                                    }
                                    ContentType.IMAGE_URI -> {
                                        val imageUri = Uri.parse(item.contentData)
                                        val contentUri = FileProvider.getUriForFile(context, context.applicationContext.packageName + ".provider", File(imageUri.path!!))
                                        putExtra(Intent.EXTRA_STREAM, contentUri)
                                        type = context.contentResolver.getType(contentUri)
                                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                    }
                                }
                            }
                            val shareIntent = Intent.createChooser(sendIntent, null)
                            context.startActivity(shareIntent)
                        }
                    ) {
                        Icon(
                            Icons.Filled.Share,
                            contentDescription = "Share"
                        )
                    }

                    IconButton(
                        onClick = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            when (item.contentType) {
                                ContentType.LINK, ContentType.TEXT -> {
                                    val clip = ClipData.newPlainText("kiler_data", item.contentData)
                                    clipboard.setPrimaryClip(clip)
                                }
                                ContentType.IMAGE_URI -> {
                                    val imageUri = Uri.parse(item.contentData)
                                    val contentUri = FileProvider.getUriForFile(context, context.applicationContext.packageName + ".provider", File(imageUri.path!!))
                                    val clipData = ClipData.newUri(context.contentResolver, "Image", contentUri)
                                    clipboard.setPrimaryClip(clipData)
                                }
                            }
                        }
                    ) {
                        Icon(
                            Icons.Outlined.ContentCopy,
                            contentDescription = "Copy"
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
                savedTimestamp = System.currentTimeMillis(),
                note = "This is a sample note."
            ),
            onDeleteClick = {},
            onEditClick = {}
        )
    }
}
