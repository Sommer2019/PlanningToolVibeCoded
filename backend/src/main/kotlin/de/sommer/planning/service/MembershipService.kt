package de.sommer.planning.service

import de.sommer.planning.domain.MembershipStatus
import de.sommer.planning.domain.ProjectMembership
import de.sommer.planning.dto.AddMemberRequest
import de.sommer.planning.repo.ProjectMembershipRepository
import de.sommer.planning.security.CurrentUser
import de.sommer.planning.web.ConflictException
import de.sommer.planning.web.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class MembershipService(
    private val memberships: ProjectMembershipRepository,
    private val access: AccessService,
    private val currentUser: CurrentUser,
) {
    /** All memberships of a project (members + pending requests). Members/admin only. */
    fun list(projectId: UUID): List<ProjectMembership> {
        access.requireMember(projectId)
        return memberships.findByProjectId(projectId)
    }

    /** Pending join requests. Owner/admin only. */
    fun listRequests(projectId: UUID): List<ProjectMembership> {
        access.requireProjectAdmin(projectId)
        return memberships.findByProjectIdAndStatus(projectId, MembershipStatus.REQUESTED)
    }

    /** Direct add by owner/admin (DECISIONS D5). */
    @Transactional
    fun addMember(projectId: UUID, req: AddMemberRequest): ProjectMembership {
        access.requireProjectAdmin(projectId)
        val existing = memberships.findByProjectIdAndUserRef(projectId, req.userRef)
        if (existing != null) {
            if (existing.status == MembershipStatus.MEMBER) {
                throw ConflictException("User is already a member")
            }
            // Promote a pending request to member.
            existing.status = MembershipStatus.MEMBER
            existing.role = req.role ?: existing.role
            return memberships.save(existing)
        }
        return memberships.save(
            ProjectMembership(
                projectId = projectId,
                userRef = req.userRef,
                status = MembershipStatus.MEMBER,
                role = req.role,
            ),
        )
    }

    /** Current user requests to join (DECISIONS D5). */
    @Transactional
    fun requestJoin(projectId: UUID): ProjectMembership {
        access.requireProject(projectId)
        val id = currentUser.require()
        val existing = memberships.findByProjectIdAndUserRef(projectId, id.userRef)
        if (existing != null) {
            throw ConflictException(
                if (existing.status == MembershipStatus.MEMBER) "Already a member" else "Request already pending",
            )
        }
        return memberships.save(
            ProjectMembership(
                projectId = projectId,
                userRef = id.userRef,
                status = MembershipStatus.REQUESTED,
            ),
        )
    }

    /** Owner/admin approves a pending request. */
    @Transactional
    fun approve(projectId: UUID, membershipId: UUID): ProjectMembership {
        access.requireProjectAdmin(projectId)
        val m = membership(projectId, membershipId)
        if (m.status != MembershipStatus.REQUESTED) throw ConflictException("Not a pending request")
        m.status = MembershipStatus.MEMBER
        return memberships.save(m)
    }

    /** Owner/admin rejects a request or removes a member. */
    @Transactional
    fun remove(projectId: UUID, membershipId: UUID) {
        access.requireProjectAdmin(projectId)
        val m = membership(projectId, membershipId)
        memberships.delete(m)
    }

    private fun membership(projectId: UUID, membershipId: UUID): ProjectMembership {
        val m = memberships.findById(membershipId)
            .orElseThrow { NotFoundException("Membership not found") }
        if (m.projectId != projectId) throw NotFoundException("Membership not found")
        return m
    }
}
