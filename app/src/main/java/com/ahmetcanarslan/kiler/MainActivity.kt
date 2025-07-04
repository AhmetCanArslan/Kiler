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
import com.ahmetcanarslan.kiler.ui.theme.KilerTheme
import com.ahmetcanarslan.kiler.viewmodel.ArchiveViewModel
import com.ahmetcanarslan.kiler.viewmodel.ArchiveViewModelFactory
import com.ahmetcanarslan.kiler.ui.screens.HistoryScreen
import com.ahmetcanarslan.kiler.viewmodel.HistoryViewModel
import com.ahmetcanarslan.kiler.viewmodel.HistoryViewModelFactory
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally

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
                    startDestination = "archive",
                    enterTransition = { EnterTransition.None },
                    exitTransition = { ExitTransition.None }
                ) {
                    composable("archive") {
                        val viewModel: ArchiveViewModel = viewModel(
                            factory = ArchiveViewModelFactory(application.repository)
                        )
                        ArchiveScreen(
                            viewModel = viewModel,
                            onNavigateToHistory = { navController.navigate("history") }
                        )
                    }

                    composable(
                        "history",
                        enterTransition = { slideInHorizontally(initialOffsetX = { it }) },
                        exitTransition = { slideOutHorizontally(targetOffsetX = { -it }) },
                        popEnterTransition = { slideInHorizontally(initialOffsetX = { -it }) },
                        popExitTransition = { slideOutHorizontally(targetOffsetX = { it }) }
                    ) {
                        val viewModel: HistoryViewModel = viewModel(
                            factory = HistoryViewModelFactory(application.repository)
                        )
                        HistoryScreen(
                            viewModel = viewModel,
                            onNavigateBack = { navController.popBackStack() }
                        )
                    }
                }
            }
        }
    }
}