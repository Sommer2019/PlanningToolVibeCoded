package com.planningtool.service

import com.planningtool.dto.*
import com.planningtool.model.CalendarEntry
import com.planningtool.model.User
import com.planningtool.repository.CalendarEntryRepository
import com.planningtool.repository.GroupRepository
import com.planningtool.repository.TaskRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDateTime

@Service
class CalendarService(
    private val calendarEntryRepository: CalendarEntryRepository,
    private val groupRepository: GroupRepository,
    private val taskRepository: TaskRepository,
    private val permissionService: PermissionService
) {

    fun getEntriesByGroup(groupId: Long, from: LocalDateTime?, to: LocalDateTime?, currentUser: User): List<CalendarEntryResponse> {
        if (!permissionService.canAccessGroup(currentUser, groupId)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this group")
        }

        val entries = if (from != null && to != null) {
            calendarEntryRepository.findByGroupIdAndDateRange(groupId, from, to)
        } else {
            calendarEntryRepository.findByGroupId(groupId)
        }

        return entries.map { CalendarEntryResponse.from(it) }
    }

    fun createEntry(request: CreateCalendarEntryRequest, currentUser: User): CalendarEntryResponse {
        if (!permissionService.canAccessGroup(currentUser, request.groupId)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this group")
        }

        val group = groupRepository.findById(request.groupId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found") }

        val task = request.taskId?.let {
            taskRepository.findById(it)
                .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found") }
        }

        if (request.end.isBefore(request.start)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time")
        }

        val entry = CalendarEntry(
            title = request.title,
            description = request.description,
            start = request.start,
            end = request.end,
            group = group,
            createdBy = currentUser,
            task = task
        )

        return CalendarEntryResponse.from(calendarEntryRepository.save(entry))
    }

    fun updateEntry(entryId: Long, request: UpdateCalendarEntryRequest, currentUser: User): CalendarEntryResponse {
        val entry = calendarEntryRepository.findById(entryId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Calendar entry not found") }

        if (!permissionService.canAccessGroup(currentUser, entry.group.id)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot edit this entry")
        }

        if (request.end.isBefore(request.start)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time")
        }

        entry.title = request.title
        entry.description = request.description
        entry.start = request.start
        entry.end = request.end

        return CalendarEntryResponse.from(calendarEntryRepository.save(entry))
    }

    fun deleteEntry(entryId: Long, currentUser: User) {
        val entry = calendarEntryRepository.findById(entryId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Calendar entry not found") }

        if (!permissionService.canAccessGroup(currentUser, entry.group.id)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete this entry")
        }

        calendarEntryRepository.delete(entry)
    }
}
