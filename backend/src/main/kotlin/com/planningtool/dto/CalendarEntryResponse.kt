package com.planningtool.dto

import com.planningtool.model.CalendarEntry
import java.time.LocalDateTime

data class CalendarEntryResponse(
    val id: Long,
    val title: String,
    val description: String?,
    val start: LocalDateTime,
    val end: LocalDateTime,
    val groupId: Long,
    val createdBy: UserSummary,
    val task: TaskSummary?,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(entry: CalendarEntry): CalendarEntryResponse = CalendarEntryResponse(
            id = entry.id,
            title = entry.title,
            description = entry.description,
            start = entry.start,
            end = entry.end,
            groupId = entry.group.id,
            createdBy = UserSummary(entry.createdBy.id, entry.createdBy.username),
            task = entry.task?.let { TaskSummary(it.id, it.title, it.status) },
            createdAt = entry.createdAt
        )
    }
}

data class TaskSummary(
    val id: Long,
    val title: String,
    val status: com.planningtool.model.TaskStatus
)
