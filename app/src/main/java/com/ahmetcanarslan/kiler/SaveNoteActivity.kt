package com.ahmetcanarslan.kiler

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.lifecycleScope
import com.ahmetcanarslan.kiler.data.ArchivedItem
import com.ahmetcanarslan.kiler.ui.theme.KilerTheme
import kotlinx.coroutines.launch
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json

class SaveNoteActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val itemJson = intent.getStringExtra("item")
        if (itemJson == null) {
            finish()
            return
        }
        val item = Json.decodeFromString<ArchivedItem>(itemJson)
        val application = application as KilerApplication
        val repository = application.repository

        setContent {
            KilerTheme {
                var note by remember { mutableStateOf(item.note ?: "") }

                Surface(modifier = Modifier.fillMaxSize()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Add or edit note", style = MaterialTheme.typography.titleLarge)
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedTextField(
                            value = note,
                            onValueChange = { note = it },
                            label = { Text("Note (optional)") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = {
                                lifecycleScope.launch {
                                    val newItem = item.copy(note = note.ifBlank { null })
                                    if(intent.hasExtra("isUpdate")) {
                                        repository.updateItem(newItem)
                                    } else {
                                        repository.insertItem(newItem)
                                    }
                                    finish()
                                    overridePendingTransition(0, R.anim.slide_out_down)
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Save")
                        }
                    }
                }
            }
        }
    }
}
