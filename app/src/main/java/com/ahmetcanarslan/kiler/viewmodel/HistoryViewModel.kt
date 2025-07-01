package com.ahmetcanarslan.kiler.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ahmetcanarslan.kiler.data.DeletedItem
import com.ahmetcanarslan.kiler.repository.KilerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch

data class HistoryUiState(
    val deletedItems: List<DeletedItem> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

class HistoryViewModel(private val repository: KilerRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(HistoryUiState())
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    init {
        fetchDeletedItems()
    }

    fun fetchDeletedItems() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            repository.getDeletedItems()
                .catch { exception ->
                    _uiState.value = _uiState.value.copy(error = exception.message, isLoading = false)
                }
                .collect { deletedItems ->
                    _uiState.value = _uiState.value.copy(deletedItems = deletedItems, isLoading = false)
                }
        }
    }

    fun restoreItem(item: DeletedItem) {
        viewModelScope.launch {
            repository.restoreDeletedItem(item)
            fetchDeletedItems() // Force refresh
        }
    }

    fun permanentlyDeleteItem(item: DeletedItem) {
        viewModelScope.launch {
            repository.deleteDeletedItemPermanently(item)
            fetchDeletedItems() // Force refresh
        }
    }
}
