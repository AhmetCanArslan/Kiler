package com.ahmetcanarslan.kiler.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ahmetcanarslan.kiler.data.ArchivedItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditNoteDialog(
    item: ArchivedItem,
    onDismiss: () -> Unit,
    onSave: (ArchivedItem, String) -> Unit
) {
    var note by remember { mutableStateOf(item.note ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Note") },
        text = {
            Column {
                Text("Add or edit the note for this item.")
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("Note") },
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onSave(item, note) }) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
