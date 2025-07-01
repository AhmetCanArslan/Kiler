package com.ahmetcanarslan.kiler.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.core.tween
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ahmetcanarslan.kiler.R
import com.ahmetcanarslan.kiler.data.ArchivedItem
import com.ahmetcanarslan.kiler.ui.components.ArchivedItemCard
import com.ahmetcanarslan.kiler.ui.components.EditNoteDialog
import com.ahmetcanarslan.kiler.ui.theme.KilerTheme
import com.ahmetcanarslan.kiler.viewmodel.ArchiveViewModel
import com.ahmetcanarslan.kiler.viewmodel.DateFilter
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.unit.dp




@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun ArchiveScreen(
    viewModel: ArchiveViewModel,
    onNavigateToHistory: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var showEditDialog by remember { mutableStateOf<ArchivedItem?>(null) }


    if (showEditDialog != null) {
        EditNoteDialog(
            item = showEditDialog!!,
            onDismiss = { showEditDialog = null },
            onSave = { item, note ->
                viewModel.updateItemNote(item, note)
                showEditDialog = null
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                modifier = Modifier.statusBarsPadding().padding(top = 24.dp),
                title = {
                    OutlinedTextField(
                        value = uiState.searchQuery,
                        onValueChange = viewModel::onSearchQueryChanged,
                        placeholder = { Text("Search in Kiler...") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateToHistory) {
                        Icon(
                            imageVector = Icons.Default.History,
                            contentDescription = "History"
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://github.com/ahmetcanarslan"))
                            context.startActivity(intent)
                        }
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_github),
                            contentDescription = "GitHub"
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
        ) {
            Spacer(modifier = Modifier.height(12.dp))
            // Date filter chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.Center
            ) {
                DateFilter.values().forEach { filter ->
                    FilterChip(
                        modifier = Modifier.padding(horizontal = 2.dp),
                        onClick = { viewModel.onDateFilterChanged(filter) },
                        label = { Text(filter.label) },
                        selected = uiState.dateFilter == filter
                    )
                }
            }




            // Content
            if (uiState.items.isEmpty() && !uiState.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No content found",
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(
                        uiState.items,
                        key = { it.id }
                    ) { item ->
                        ArchivedItemCard(
                            modifier = Modifier.animateItemPlacement(
                                tween(durationMillis = 300)
                            ),
                            item = item,
                            onDeleteClick = { viewModel.deleteItem(item) },
                            onEditClick = { showEditDialog = item }
                        )
                    }
                }
            }
        }
    }
    
    // Error handling
    uiState.error?.let { error ->
        LaunchedEffect(error) {
            // Handle error - could show a SnackBar
        }
    }
}

@Preview
@Composable
fun ArchiveScreenPreview() {
    KilerTheme {
        // Preview without ViewModel
    }
}


