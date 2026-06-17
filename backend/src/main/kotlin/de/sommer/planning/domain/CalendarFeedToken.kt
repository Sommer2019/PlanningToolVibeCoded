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

/**
 * Token for the subscribable read-only iCal feed. Per-user and/or per-project.
 * The token itself is the credential (the feed URL needs no auth header).
 * See DECISIONS D8.
 */
@Entity
@Table(name = "calendar_feed_token")
class CalendarFeedToken(
    @Column(nullable = false, unique = true)
    var token: String,

    /** Per-user feed (null = not user-scoped). */
    @Column(name = "user_ref")
    var userRef: String? = null,

    /** Per-project feed (null = not project-scoped). */
    @Column(name = "project_id")
    var projectId: UUID? = null,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant? = null
}
