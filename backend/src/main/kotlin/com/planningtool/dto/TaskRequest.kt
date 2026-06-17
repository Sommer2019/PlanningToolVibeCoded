package com.planningtool.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.LocalDateTime

data class CreateTaskRequest(
    @field:NotBlank(message = "Title is required")
    val title: String,

    val description: String? = null,

    val assigneeId: Long? = null,

    @field:NotNull(message = "Group ID is required")
    val groupId: Long,

    val plannedStart: LocalDateTime? = null,

    val plannedEnd: LocalDateTime? = null
)

data class UpdateTaskRequest(
    @field:NotBlank(message = "Title is required")
    val title: String,

    val description: String? = null,

    val assigneeId: Long? = null,

    val plannedStart: LocalDateTime? = null,

    val plannedEnd: LocalDateTime? = null
)

data class UpdateTaskStatusRequest(
    @field:NotNull(message = "Status is required")
    val status: String
)

data class LockTaskRequest(
    @field:NotNull(message = "isLocked is required")
    val isLocked: Boolean
)
