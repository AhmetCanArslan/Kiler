package com.ahmetcanarslan.kiler.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import com.ahmetcanarslan.kiler.R

val MontserratFontFamily = FontFamily(
    Font(R.font.montserrat_regular),
    Font(R.font.montserrat_medium, FontWeight.Medium),
    Font(R.font.montserrat_semibold, FontWeight.SemiBold),
    Font(R.font.montserrat_bold, FontWeight.Bold)
)

val Typography = Typography().run {
    copy(
        displayLarge = displayLarge.copy(fontFamily = MontserratFontFamily),
        displayMedium = displayMedium.copy(fontFamily = MontserratFontFamily),
        displaySmall = displaySmall.copy(fontFamily = MontserratFontFamily),
        headlineLarge = headlineLarge.copy(fontFamily = MontserratFontFamily),
        headlineMedium = headlineMedium.copy(fontFamily = MontserratFontFamily),
        headlineSmall = headlineSmall.copy(fontFamily = MontserratFontFamily),
        titleLarge = titleLarge.copy(fontFamily = MontserratFontFamily),
        titleMedium = titleMedium.copy(fontFamily = MontserratFontFamily),
        titleSmall = titleSmall.copy(fontFamily = MontserratFontFamily),
        bodyLarge = bodyLarge.copy(fontFamily = MontserratFontFamily),
        bodyMedium = bodyMedium.copy(fontFamily = MontserratFontFamily),
        bodySmall = bodySmall.copy(fontFamily = MontserratFontFamily),
        labelLarge = labelLarge.copy(fontFamily = MontserratFontFamily),
        labelMedium = labelMedium.copy(fontFamily = MontserratFontFamily),
        labelSmall = labelSmall.copy(fontFamily = MontserratFontFamily)
    )
}
