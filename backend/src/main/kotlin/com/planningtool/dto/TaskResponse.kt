package com.planningtool.dto

import com.planningtool.model.Task
import com.planningtool.model.TaskStatus
import java.time.LocalDateTime

data class TaskResponse(
    val id: Long,
    val title: String,
    val description: String?,
    val assignee: UserSummary?,
    val createdBy: UserSummary,
    val groupId: Long,
    val status: TaskStatus,
    val plannedStart: LocalDateTime?,
    val plannedEnd: LocalDateTime?,
    val isLocked: Boolean,
    val lockedBy: UserSummary?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun from(task: Task): TaskResponse = TaskResponse(
            id = task.id,
            title = task.title,
            description = task.description,
            assignee = task.assignee?.let { UserSummary(it.id, it.username) },
            createdBy = UserSummary(task.createdBy.id, task.createdBy.username),
            groupId = task.group.id,
            status = task.status,
            plannedStart = task.plannedStart,
            plannedEnd = task.plannedEnd,
            isLocked = task.isLocked,
            lockedBy = task.lockedBy?.let { UserSummary(it.id, it.username) },
            createdAt = task.createdAt,
            updatedAt = task.updatedAt
        )
    }
}

data class UserSummary(
    val id: Long,
    val username: String
)
