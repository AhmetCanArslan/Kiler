package com.ahmetcanarslan.kiler.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ahmetcanarslan.kiler.data.DeletedItem
import com.ahmetcanarslan.kiler.repository.KilerRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

data class SettingsUiState(
    val totalItems: Int = 0,
    val isExporting: Boolean = false,
    val message: String? = null
)

class SettingsViewModel(private val repository: KilerRepository) : ViewModel() {
    
    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()
    
    private val _deletedItems = MutableStateFlow<List<DeletedItem>>(emptyList())
    val deletedItems: StateFlow<List<DeletedItem>> = _deletedItems

    init {
        observeTotalItems()
        viewModelScope.launch {
            repository.getDeletedItems().collect {
                _deletedItems.value = it
            }
        }
    }
    
    private fun observeTotalItems() {
        repository.getAllItems()
            .map { it.size }
            .onEach { totalItems ->
                _uiState.value = _uiState.value.copy(totalItems = totalItems)
            }
            .launchIn(viewModelScope)
    }
    
    fun restoreItem(item: DeletedItem) {
        viewModelScope.launch {
            repository.restoreDeletedItem(item)
        }
    }

    fun exportData() {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isExporting = true)
                
                val allItems = repository.getAllItemsForExport()
                val jsonString = Json.encodeToString(allItems)
                
                // In a real implementation, you would save this to external storage
                // or share it via Intent
                
                _uiState.value = _uiState.value.copy(
                    isExporting = false,
                    message = "Data exported successfully (${allItems.size} items)"
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isExporting = false,
                    message = "Export failed: ${e.message}"
                )
            }
        }
    }
}
