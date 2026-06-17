package com.planningtool.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.LocalDateTime

data class CreateCalendarEntryRequest(
    @field:NotBlank(message = "Title is required")
    val title: String,

    val description: String? = null,

    @field:NotNull(message = "Start time is required")
    val start: LocalDateTime,

    @field:NotNull(message = "End time is required")
    val end: LocalDateTime,

    @field:NotNull(message = "Group ID is required")
    val groupId: Long,

    val taskId: Long? = null
)

data class UpdateCalendarEntryRequest(
    @field:NotBlank(message = "Title is required")
    val title: String,

    val description: String? = null,

    @field:NotNull(message = "Start time is required")
    val start: LocalDateTime,

    @field:NotNull(message = "End time is required")
    val end: LocalDateTime
)
