package com.ahmetcanarslan.kiler

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.URLUtil
import androidx.activity.ComponentActivity
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import com.ahmetcanarslan.kiler.data.ArchivedItem
import com.ahmetcanarslan.kiler.data.ContentType
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import java.io.FileOutputStream

class ShareReceiverActivity : ComponentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val application = application as KilerApplication
        val repository = application.repository
        
        when (intent?.action) {
            Intent.ACTION_SEND -> {
                when (intent.type) {
                    "text/plain" -> {
                        val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
                        val sourceApp = callingPackage
                        
                        if (sharedText != null) {
                            lifecycleScope.launch {
                                val item = if (URLUtil.isValidUrl(sharedText)) {
                                    // It's a URL, fetch preview
                                    val (title, image) = repository.fetchWebPreview(sharedText)
                                    ArchivedItem(
                                        contentType = ContentType.LINK,
                                        contentData = sharedText,
                                        contentPreviewTitle = title,
                                        contentPreviewImage = image,
                                        sourceApplication = sourceApp,
                                        savedTimestamp = System.currentTimeMillis()
                                    )
                                } else {
                                    // Plain text
                                    ArchivedItem(
                                        contentType = ContentType.TEXT,
                                        contentData = sharedText,
                                        sourceApplication = sourceApp,
                                        savedTimestamp = System.currentTimeMillis()
                                    )
                                }
                                
                                val intent = Intent(this@ShareReceiverActivity, SaveNoteActivity::class.java).apply {
                                    putExtra("item", Json.encodeToString(item))
                                }
                                startActivity(intent)
                                overridePendingTransition(R.anim.slide_in_up, 0)
                                finish()
                            }
                        } else {
                            finish()
                        }
                    }
                    
                    else -> {
                        if (intent.type?.startsWith("image/") == true) {
                            val imageUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
                            val sourceApp = callingPackage
                            
                            if (imageUri != null) {
                                lifecycleScope.launch {
                                    val savedUri = saveImageToInternalStorage(imageUri)
                                    if (savedUri != null) {
                                        val item = ArchivedItem(
                                            contentType = ContentType.IMAGE_URI,
                                            contentData = savedUri.toString(),
                                            sourceApplication = sourceApp,
                                            savedTimestamp = System.currentTimeMillis()
                                        )
                                        val intent = Intent(this@ShareReceiverActivity, SaveNoteActivity::class.java).apply {
                                            putExtra("item", Json.encodeToString(item))
                                        }
                                        startActivity(intent)
                                        overridePendingTransition(R.anim.slide_in_up, 0)
                                    }
                                    finish()
                                }
                            } else {
                                finish()
                            }
                        } else {
                            finish()
                        }
                    }
                }
            }
            else -> finish()
        }
    }
    
    private suspend fun saveImageToInternalStorage(uri: Uri): Uri? {
        return try {
            val inputStream = contentResolver.openInputStream(uri)
            val fileName = "image_${System.currentTimeMillis()}.jpg"
            val file = File(filesDir, fileName)

            inputStream?.use { input ->
                FileOutputStream(file).use { output ->
                    input.copyTo(output)
                }
            }

            getUriFromFile(file)
        } catch (e: Exception) {
            null
        }
    }

    private fun getUriFromFile(file: File): Uri {
        return FileProvider.getUriForFile(this, "${applicationContext.packageName}.provider", file)
    }
}
