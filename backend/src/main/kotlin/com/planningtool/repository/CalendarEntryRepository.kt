package com.planningtool.repository

import com.planningtool.model.CalendarEntry
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface CalendarEntryRepository : JpaRepository<CalendarEntry, Long> {
    fun findByGroupId(groupId: Long): List<CalendarEntry>
    fun findByCreatedById(userId: Long): List<CalendarEntry>

    @Query("SELECT e FROM CalendarEntry e WHERE e.group.id = :groupId AND e.start >= :from AND e.end <= :to")
    fun findByGroupIdAndDateRange(groupId: Long, from: LocalDateTime, to: LocalDateTime): List<CalendarEntry>
}
