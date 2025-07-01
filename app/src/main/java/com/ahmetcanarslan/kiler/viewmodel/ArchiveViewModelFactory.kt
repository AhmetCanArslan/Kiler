package com.ahmetcanarslan.kiler.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.ahmetcanarslan.kiler.repository.KilerRepository

class ArchiveViewModelFactory(private val repository: KilerRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ArchiveViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return ArchiveViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
