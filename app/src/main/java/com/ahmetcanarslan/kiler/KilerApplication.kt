package com.ahmetcanarslan.kiler

import android.app.Application
import com.ahmetcanarslan.kiler.data.KilerDatabase
import com.ahmetcanarslan.kiler.repository.KilerRepository

class KilerApplication : Application() {
    
    val database by lazy { KilerDatabase.getDatabase(this) }
    val repository by lazy { KilerRepository(database.archivedItemDao()) }
}
