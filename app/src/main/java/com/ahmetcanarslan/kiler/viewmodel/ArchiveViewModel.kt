package com.ahmetcanarslan.kiler.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ahmetcanarslan.kiler.data.ArchivedItem
import com.ahmetcanarslan.kiler.repository.KilerRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*

data class ArchiveUiState(
    val items: List<ArchivedItem> = emptyList(),
    val searchQuery: String = "",
    val selectedDateFilter: DateFilter = DateFilter.ALL,
    val isLoading: Boolean = false,
    val error: String? = null
)

enum class DateFilter(val label: String, val daysBefore: Int?) {
    TODAY("Today", 0),
    LAST_7_DAYS("Last 7 days", 7),
    THIS_MONTH("This Month", 30),
    ALL("All", null)
}

class ArchiveViewModel(private val repository: KilerRepository) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ArchiveUiState())
    val uiState: StateFlow<ArchiveUiState> = _uiState.asStateFlow()
    
    init {
        observeItems()
    }
    
    private fun observeItems() {
        combine(
            _uiState.map { it.searchQuery },
            _uiState.map { it.selectedDateFilter }
        ) { query, dateFilter ->
            val fromTimestamp = dateFilter.daysBefore?.let {
                val calendar = Calendar.getInstance()
                calendar.add(Calendar.DAY_OF_YEAR, -it)
                calendar.timeInMillis
            } ?: 0L
            
            if (query.isBlank()) {
                repository.searchItems("", fromTimestamp)
            } else {
                repository.searchItems(query, fromTimestamp)
            }
        }.flatMapLatest { it }
            .catch { exception ->
                _uiState.value = _uiState.value.copy(error = exception.message)
            }
            .onEach { items ->
                _uiState.value = _uiState.value.copy(
                    items = items,
                    isLoading = false,
                    error = null
                )
            }
            .launchIn(viewModelScope)
    }
    
    fun onSearchQueryChanged(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
    }
    
    fun onDateFilterChanged(filter: DateFilter) {
        _uiState.value = _uiState.value.copy(selectedDateFilter = filter)
    }
    
    fun deleteItem(item: ArchivedItem) {
        viewModelScope.launch {
            try {
                repository.deleteItem(item)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = e.message)
            }
        }
    }
}
