package de.sommer.planning.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import org.hibernate.annotations.CreationTimestamp
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "task",
    indexes = [
        Index(name = "idx_task_project", columnList = "project_id"),
        Index(name = "idx_task_assignee", columnList = "assignee"),
        Index(name = "idx_task_status", columnList = "status_id"),
    ],
)
class Task(
    @Column(name = "project_id", nullable = false)
    var projectId: UUID,

    @Column(nullable = false)
    var title: String,

    @Column(columnDefinition = "text")
    var description: String? = null,

    /** userRef (JWT subject) of the assignee. Required. */
    @Column
    var assignee: String? = null,

    @Column(name = "status_id", nullable = false)
    var statusId: UUID,

    @Column(name = "planned_start", nullable = false)
    var plannedStart: Instant,

    @Column(name = "planned_end", nullable = false)
    var plannedEnd: Instant,

    @Column(name = "actual_start")
    var actualStart: Instant? = null,

    @Column(name = "actual_end")
    var actualEnd: Instant? = null,

    @Column(nullable = false)
    var locked: Boolean = false,

    @Column(nullable = false)
    var difficulty: Int = 1,

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
