package de.sommer.planning.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.CreationTimestamp
import java.time.Instant
import java.util.UUID

/** A standalone calendar entry, not bound to a task. */
@Entity
@Table(name = "calendar_entry")
class CalendarEntry(
    @Column(nullable = false)
    var title: String,

    @Column(columnDefinition = "text")
    var description: String? = null,

    @Column(nullable = false)
    var start: Instant,

    @Column(name = "end_time", nullable = false)
    var end: Instant,

    /** Optional project scope. */
    @Column(name = "project_id")
    var projectId: UUID? = null,

    /** Optional owner (userRef). */
    @Column(name = "user_ref")
    var userRef: String? = null,

    @Column(name = "created_by", nullable = false, updatable = false)
    var createdBy: String,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant? = null
}
