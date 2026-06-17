package de.sommer.planning.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import org.hibernate.annotations.CreationTimestamp
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "project_membership",
    uniqueConstraints = [UniqueConstraint(columnNames = ["project_id", "user_ref"])],
)
class ProjectMembership(
    @Column(name = "project_id", nullable = false)
    var projectId: UUID,

    /** userRef (JWT subject) of the member. */
    @Column(name = "user_ref", nullable = false)
    var userRef: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: MembershipStatus,

    /** Optional project-scoped role label (not used for authz yet, see OP4). */
    @Column
    var role: String? = null,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant? = null
}
