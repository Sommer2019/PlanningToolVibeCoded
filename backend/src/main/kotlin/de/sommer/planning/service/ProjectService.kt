package de.sommer.planning.service

import de.sommer.planning.domain.MembershipStatus
import de.sommer.planning.domain.Project
import de.sommer.planning.domain.ProjectMembership
import de.sommer.planning.dto.CreateProjectRequest
import de.sommer.planning.dto.UpdateProjectRequest
import de.sommer.planning.repo.ProjectMembershipRepository
import de.sommer.planning.repo.ProjectRepository
import de.sommer.planning.security.CurrentUser
import de.sommer.planning.web.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class ProjectService(
    private val projects: ProjectRepository,
    private val memberships: ProjectMembershipRepository,
    private val access: AccessService,
    private val currentUser: CurrentUser,
) {
    /** Projects visible to the current user: all (admin) or those they are a member of. */
    fun listVisible(): List<Project> {
        val id = currentUser.require()
        if (id.admin) return projects.findAll()
        val memberProjectIds = memberships
            .findByUserRefAndStatus(id.userRef, MembershipStatus.MEMBER)
            .map { it.projectId }
            .toSet()
        return projects.findAllById(memberProjectIds).toList()
    }

    fun get(projectId: UUID): Project = access.requireMember(projectId)

    @Transactional
    fun create(req: CreateProjectRequest): Project {
        val id = currentUser.require()
        val project = projects.save(
            Project(name = req.name, description = req.description, createdBy = id.userRef),
        )
        // Creator becomes a member automatically.
        memberships.save(
            ProjectMembership(
                projectId = project.id!!,
                userRef = id.userRef,
                status = MembershipStatus.MEMBER,
                role = "owner",
            ),
        )
        return project
    }

    @Transactional
    fun update(projectId: UUID, req: UpdateProjectRequest): Project {
        val project = access.requireProjectAdmin(projectId)
        project.name = req.name
        project.description = req.description
        return projects.save(project)
    }

    @Transactional
    fun delete(projectId: UUID) {
        access.requireProjectAdmin(projectId)
        if (!projects.existsById(projectId)) throw NotFoundException("Project not found")
        projects.deleteById(projectId)
    }
}
