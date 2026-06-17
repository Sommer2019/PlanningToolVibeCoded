package com.planningtool.controller

import com.planningtool.dto.*
import com.planningtool.model.User
import com.planningtool.repository.UserRepository
import com.planningtool.service.CalendarService
import jakarta.validation.Valid
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/calendar")
@CrossOrigin(origins = ["*"])
class CalendarController(
    private val calendarService: CalendarService,
    private val userRepository: UserRepository
) {

    /**
     * Get all calendar entries for a group, optionally filtered by date range.
     */
    @GetMapping
    fun getEntries(
        @RequestParam groupId: Long,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) from: LocalDateTime?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) to: LocalDateTime?,
        @RequestHeader("X-User-Id") userId: Long
    ): ResponseEntity<List<CalendarEntryResponse>> {
        val user = getCurrentUser(userId)
        return ResponseEntity.ok(calendarService.getEntriesByGroup(groupId, from, to, user))
    }

    /**
     * Create a new calendar entry.
     */
    @PostMapping
    fun createEntry(
        @Valid @RequestBody request: CreateCalendarEntryRequest,
        @RequestHeader("X-User-Id") userId: Long
    ): ResponseEntity<CalendarEntryResponse> {
        val user = getCurrentUser(userId)
        return ResponseEntity.status(HttpStatus.CREATED).body(calendarService.createEntry(request, user))
    }

    /**
     * Update an existing calendar entry.
     */
    @PutMapping("/{id}")
    fun updateEntry(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateCalendarEntryRequest,
        @RequestHeader("X-User-Id") userId: Long
    ): ResponseEntity<CalendarEntryResponse> {
        val user = getCurrentUser(userId)
        return ResponseEntity.ok(calendarService.updateEntry(id, request, user))
    }

    /**
     * Delete a calendar entry.
     */
    @DeleteMapping("/{id}")
    fun deleteEntry(
        @PathVariable id: Long,
        @RequestHeader("X-User-Id") userId: Long
    ): ResponseEntity<Void> {
        val user = getCurrentUser(userId)
        calendarService.deleteEntry(id, user)
        return ResponseEntity.noContent().build()
    }

    private fun getCurrentUser(userId: Long): User {
        return userRepository.findById(userId)
            .orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found") }
    }
}
