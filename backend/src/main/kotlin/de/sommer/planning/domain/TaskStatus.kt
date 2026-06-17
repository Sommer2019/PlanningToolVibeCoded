package de.sommer.planning.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

/**
 * Configurable status (NOT a hard enum). Global defaults have [projectId] = null.
 * See DECISIONS D6.
 */
@Entity
@Table(name = "task_status")
class TaskStatus(
    @Column(nullable = false)
    var name: String,

    /** null = global/default status; otherwise scoped to a project. */
    @Column(name = "project_id")
    var projectId: UUID? = null,

    /** Display order within the board (ORDER is a reserved SQL word -> sort_order). */
    @Column(name = "sort_order", nullable = false)
    var order: Int = 0,

    @Column(name = "is_default", nullable = false)
    var isDefault: Boolean = false,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null
}
