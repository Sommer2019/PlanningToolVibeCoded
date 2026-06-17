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

@Entity
@Table(name = "project")
class Project(
    @Column(nullable = false)
    var name: String,

    @Column(columnDefinition = "text")
    var description: String? = null,

    /** userRef (JWT subject) of the creator. */
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
