package com.ahmetcanarslan.kiler.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Restore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ahmetcanarslan.kiler.data.DeletedItem
import com.ahmetcanarslan.kiler.ui.theme.KilerTheme
import com.ahmetcanarslan.kiler.viewmodel.SettingsViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel = viewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val deletedItems by viewModel.deletedItems.collectAsState()
    var showDeletedHistory by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Export Data",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Export all your archived content to JSON format",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { viewModel.exportData() },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Export Data")
                    }
                }
            }

            Card {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Storage",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Total items: ${uiState.totalItems}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            if (uiState.isExporting) {
                Card {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Text("Exporting data...")
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = { showDeletedHistory = !showDeletedHistory },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(if (showDeletedHistory) "Hide Deleted Items History" else "Show Deleted Items History")
            }

            if (showDeletedHistory) {
                Text(
                    text = "Deleted Items History",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(vertical = 12.dp)
                )
                if (deletedItems.isEmpty()) {
                    Text("No deleted items.", style = MaterialTheme.typography.bodyMedium)
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f, fill = false)
                    ) {
                        items(deletedItems, key = { it.id }) { item ->
                            DeletedItemHistoryCard(
                                item = item,
                                onRestoreClick = { viewModel.restoreItem(item) },
                                onDeletePermanentlyClick = { viewModel.deleteItemPermanently(item) }
                            )
                        }
                    }
                }
            }
        }
    }

    uiState.message?.let { message ->
        LaunchedEffect(message) {
            // Could show a SnackBar with the message
        }
    }
}

@Composable
fun DeletedItemHistoryCard(
    item: DeletedItem,
    onRestoreClick: () -> Unit,
    onDeletePermanentlyClick: () -> Unit
) {
    var showDeleteDialog by remember { mutableStateOf(false) }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Permanently") },
            text = { Text("Are you sure you want to permanently delete this item? This action cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onDeletePermanentlyClick()
                        showDeleteDialog = false
                    }
                ) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Row(
            modifier = Modifier.padding(start = 12.dp, end = 4.dp, top = 4.dp, bottom = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("Type: ${item.contentType}", style = MaterialTheme.typography.bodyMedium)
                Text("Data: ${item.contentData}", style = MaterialTheme.typography.bodySmall, maxLines = 2, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
                item.contentPreviewTitle?.let {
                    Text("Title: $it", style = MaterialTheme.typography.bodySmall)
                }
                item.contentPreviewImage?.let {
                    Text("Preview Image: $it", style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
                }
                Text(
                    "Saved: ${item.savedTimestamp.toDateString()}",
                    style = MaterialTheme.typography.labelSmall
                )
                Text(
                    "Deleted: ${item.deletedTimestamp.toDateString()}",
                    style = MaterialTheme.typography.labelSmall
                )
            }
            Row {
                IconButton(onClick = onRestoreClick) {
                    Icon(
                        imageVector = Icons.Default.Restore,
                        contentDescription = "Restore Item"
                    )
                }
                IconButton(onClick = { showDeleteDialog = true }) {
                    Icon(
                        imageVector = Icons.Default.DeleteForever,
                        contentDescription = "Delete Permanently",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

private fun Long.toDateString(): String {
    val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
    return sdf.format(Date(this))
}

@Preview
@Composable
fun SettingsScreenPreview() {
    KilerTheme {
        // Preview without ViewModel
    }
}

@Preview(showBackground = true)
@Composable
fun DeletedItemHistoryCardPreview() {
    DeletedItemHistoryCard(
        DeletedItem(
            id = 1,
            contentType = "TEXT",
            contentData = "Sample deleted text",
            contentPreviewTitle = "Sample Title",
            contentPreviewImage = null,
            sourceApplication = "com.example.app",
            savedTimestamp = System.currentTimeMillis() - 86400000, // 1 day ago
            deletedTimestamp = System.currentTimeMillis()
        ),
        onRestoreClick = {},
        onDeletePermanentlyClick = {}
    )
}
