package com.ahmetcanarslan.kiler.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ahmetcanarslan.kiler.data.ArchivedItem
import com.ahmetcanarslan.kiler.repository.KilerRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

// Add DateFilter enum if it's not defined elsewhere
enum class DateFilter(val label: String) {
    TODAY("Today"),
    LAST_7_DAYS("Last Week"),
    LAST_30_DAYS("Last Month"),
    ALL("All"),
}

data class ArchiveUiState(
    val items: List<ArchivedItem> = emptyList(),
    val searchQuery: String = "",
    val dateFilter: DateFilter = DateFilter.ALL,
    val isLoading: Boolean = false,
    val error: String? = null
)

class ArchiveViewModel(private val repository: KilerRepository) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()

    private val _dateFilter = MutableStateFlow(DateFilter.ALL)
    val dateFilter = _dateFilter.asStateFlow()

    val uiState = combine(
        repository.getAllItems(),
        _searchQuery,
        _dateFilter
    ) { items, query, filter ->
        val filteredItems = items.filter { item ->
            val matchesQuery = query.isBlank() ||
                    item.contentData.contains(query, ignoreCase = true) ||
                    item.contentPreviewTitle?.contains(query, ignoreCase = true) == true

            val matchesDate = when (filter) {
                DateFilter.ALL -> true
                DateFilter.TODAY -> System.currentTimeMillis() - item.savedTimestamp <= 24L * 60 * 60 * 1000
                DateFilter.LAST_7_DAYS -> System.currentTimeMillis() - item.savedTimestamp <= 7L * 24 * 60 * 60 * 1000
                DateFilter.LAST_30_DAYS -> System.currentTimeMillis() - item.savedTimestamp <= 30L * 24 * 60 * 60 * 1000
            }
            matchesQuery && matchesDate
        }.sortedByDescending { it.savedTimestamp }
        ArchiveUiState(items = filteredItems, searchQuery = query, dateFilter = filter, isLoading = false)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = ArchiveUiState(isLoading = true)
    )

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun onDateFilterChanged(filter: DateFilter) {
        _dateFilter.value = filter
    }

    fun deleteItem(item: ArchivedItem) {
        viewModelScope.launch {
            // The error handling here was incorrect as uiState is a read-only Flow.
            // A proper implementation would use a separate channel/flow for one-off events like errors.
            // For now, just calling the repository.
            repository.deleteItem(item)
        }
    }
}
