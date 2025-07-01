package com.ahmetcanarslan.kiler

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.ahmetcanarslan.kiler.ui.screens.ArchiveScreen
import com.ahmetcanarslan.kiler.ui.screens.SettingsScreen
import com.ahmetcanarslan.kiler.ui.theme.KilerTheme
import com.ahmetcanarslan.kiler.viewmodel.ArchiveViewModel
import com.ahmetcanarslan.kiler.viewmodel.ArchiveViewModelFactory
import com.ahmetcanarslan.kiler.viewmodel.SettingsViewModel
import com.ahmetcanarslan.kiler.viewmodel.SettingsViewModelFactory

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val application = application as KilerApplication

        setContent {
            KilerTheme {
                val navController = rememberNavController()

                NavHost(
                    navController = navController,
                    startDestination = "archive"
                ) {
                    composable("archive") {
                        val viewModel: ArchiveViewModel = viewModel(
                            factory = ArchiveViewModelFactory(application.repository)
                        )
                        ArchiveScreen(
                            viewModel = viewModel,
                            onNavigateToSettings = { navController.navigate("settings") }
                        )
                    }

                    composable("settings") {
                        val viewModel: SettingsViewModel = viewModel(
                            factory = SettingsViewModelFactory(application.repository)
                        )
                        SettingsScreen(
                            viewModel = viewModel,
                            onNavigateBack = { navController.popBackStack() }
                        )
                    }
                }
            }
        }
    }
}