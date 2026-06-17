package de.sommer.planning.repo

import de.sommer.planning.domain.CalendarEntry
import de.sommer.planning.domain.CalendarFeedToken
import de.sommer.planning.domain.MembershipStatus
import de.sommer.planning.domain.Project
import de.sommer.planning.domain.ProjectMembership
import de.sommer.planning.domain.Task
import de.sommer.planning.domain.TaskStatus
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ProjectRepository : JpaRepository<Project, UUID>

interface ProjectMembershipRepository : JpaRepository<ProjectMembership, UUID> {
    fun findByProjectId(projectId: UUID): List<ProjectMembership>
    fun findByProjectIdAndStatus(projectId: UUID, status: MembershipStatus): List<ProjectMembership>
    fun findByUserRefAndStatus(userRef: String, status: MembershipStatus): List<ProjectMembership>
    fun findByProjectIdAndUserRef(projectId: UUID, userRef: String): ProjectMembership?
    fun existsByProjectIdAndUserRefAndStatus(projectId: UUID, userRef: String, status: MembershipStatus): Boolean
}

interface TaskStatusRepository : JpaRepository<TaskStatus, UUID> {
    fun findByProjectIdIsNullOrderByOrderAsc(): List<TaskStatus>
    fun findByProjectIdOrderByOrderAsc(projectId: UUID): List<TaskStatus>
    fun findByProjectIdIsNullAndName(name: String): TaskStatus?
}

interface TaskRepository : JpaRepository<Task, UUID> {
    fun findByProjectId(projectId: UUID): List<Task>
    fun findByProjectIdAndAssignee(projectId: UUID, assignee: String): List<Task>
    fun findByAssignee(assignee: String): List<Task>
    fun countByStatusId(statusId: UUID): Long
    fun countByProjectId(projectId: UUID): Long
}

interface CalendarEntryRepository : JpaRepository<CalendarEntry, UUID> {
    fun findByProjectId(projectId: UUID): List<CalendarEntry>
    fun findByUserRef(userRef: String): List<CalendarEntry>
}

interface CalendarFeedTokenRepository : JpaRepository<CalendarFeedToken, UUID> {
    fun findByToken(token: String): CalendarFeedToken?
    fun findByUserRefAndProjectId(userRef: String?, projectId: UUID?): CalendarFeedToken?
}
