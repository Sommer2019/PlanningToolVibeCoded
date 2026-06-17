package de.sommer.planning.service

import de.sommer.planning.domain.MembershipStatus
import de.sommer.planning.domain.Project
import de.sommer.planning.domain.Task
import de.sommer.planning.repo.ProjectMembershipRepository
import de.sommer.planning.repo.ProjectRepository
import de.sommer.planning.security.CurrentUser
import de.sommer.planning.web.ForbiddenException
import de.sommer.planning.web.NotFoundException
import de.sommer.planning.web.BadRequestException
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Centralized authorization checks. Rules (see DECISIONS D4/D5/D7):
 * - Admins have general access to all projects.
 * - A project member can read/create within their projects.
 * - A "project owner" = the project's creator. Owner or admin may manage
 *   memberships, statuses, and lock/unlock tasks.
 * - Locked tasks are editable only by admin or the task creator.
 */
@Service
class AccessService(
    private val projects: ProjectRepository,
    private val memberships: ProjectMembershipRepository,
    private val currentUser: CurrentUser,
) {
    fun requireProject(projectId: UUID): Project =
        projects.findById(projectId).orElseThrow { NotFoundException("Project not found") }

    fun isMember(projectId: UUID, userRef: String): Boolean =
        memberships.existsByProjectIdAndUserRefAndStatus(projectId, userRef, MembershipStatus.MEMBER)

    /** Admin or active member. Throws if neither. Returns the project. */
    fun requireMember(projectId: UUID): Project {
        val project = requireProject(projectId)
        val id = currentUser.require()
        if (id.admin) return project
        if (isMember(projectId, id.userRef)) return project
        throw ForbiddenException("Not a member of this project")
    }

    /** Verifies that a specific userRef is a member of the project. Useful for validating assignees. */
    fun requireIsMember(projectId: UUID, userRef: String) {
        if (!isMember(projectId, userRef)) {
            throw BadRequestException("Assignee is not a member of this project")
        }
    }

    /** Admin or project owner (creator). */
    fun requireProjectAdmin(projectId: UUID): Project {
        val project = requireProject(projectId)
        val id = currentUser.require()
        if (id.admin || project.createdBy == id.userRef) return project
        throw ForbiddenException("Requires admin or project owner")
    }

    fun requireGlobalAdmin() {
        if (!currentUser.isAdmin()) throw ForbiddenException("Requires admin")
    }

    fun isProjectOwnerOrAdmin(project: Project): Boolean {
        val id = currentUser.require()
        return id.admin || project.createdBy == id.userRef
    }

    /**
     * Whether the current user may edit the given task. Requires membership;
     * a locked task additionally requires admin or being the creator.
     */
    fun canEditTask(task: Task): Boolean {
        val id = currentUser.require()
        if (!id.admin && !isMember(task.projectId, id.userRef)) return false
        if (task.locked && !id.admin && task.createdBy != id.userRef) return false
        return true
    }

    fun requireCanEditTask(task: Task) {
        if (!canEditTask(task)) {
            throw ForbiddenException(
                if (task.locked) "Task is locked" else "Not allowed to edit this task",
            )
        }
    }
}
