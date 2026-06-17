package de.sommer.planning.dto

import de.sommer.planning.domain.CalendarEntry
import de.sommer.planning.domain.MembershipStatus
import de.sommer.planning.domain.Project
import de.sommer.planning.domain.ProjectMembership
import de.sommer.planning.domain.Task
import de.sommer.planning.domain.TaskStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

// ---------- Projects ----------

data class ProjectResponse(
    val id: UUID,
    val name: String,
    val description: String?,
    val createdBy: String,
    val createdAt: Instant?,
)

data class CreateProjectRequest(
    @field:NotBlank val name: String,
    val description: String? = null,
)

data class UpdateProjectRequest(
    @field:NotBlank val name: String,
    val description: String? = null,
)

fun Project.toResponse() = ProjectResponse(id!!, name, description, createdBy, createdAt)

// ---------- Memberships ----------

data class MembershipResponse(
    val id: UUID,
    val projectId: UUID,
    val userRef: String,
    val status: MembershipStatus,
    val role: String?,
)

data class AddMemberRequest(
    @field:NotBlank val userRef: String,
    val role: String? = null,
)

fun ProjectMembership.toResponse() = MembershipResponse(id!!, projectId, userRef, status, role)

// ---------- Statuses ----------

data class StatusResponse(
    val id: UUID,
    val projectId: UUID?,
    val name: String,
    val order: Int,
    val isDefault: Boolean,
)

data class CreateStatusRequest(
    @field:NotBlank val name: String,
    /** null = global status (admin only). */
    val projectId: UUID? = null,
    val order: Int? = null,
)

data class UpdateStatusRequest(
    @field:NotBlank val name: String,
    val order: Int? = null,
)

fun TaskStatus.toResponse() = StatusResponse(id!!, projectId, name, order, isDefault)

// ---------- Tasks ----------

data class TaskResponse(
    val id: UUID,
    val projectId: UUID,
    val title: String,
    val description: String?,
    val assignee: String?,
    val statusId: UUID,
    val plannedStart: Instant,
    val plannedEnd: Instant,
    val actualStart: Instant?,
    val actualEnd: Instant?,
    val locked: Boolean,
    val createdBy: String,
    val createdAt: Instant?,
)

data class CreateTaskRequest(
    @field:NotBlank val title: String,
    val description: String? = null,
    val assignee: String? = null,
    @field:NotNull val statusId: UUID,
    @field:NotNull val plannedStart: Instant,
    @field:NotNull val plannedEnd: Instant,
    val actualStart: Instant? = null,
    val actualEnd: Instant? = null,
)

data class UpdateTaskRequest(
    @field:NotBlank val title: String,
    val description: String? = null,
    val assignee: String? = null,
    @field:NotNull val statusId: UUID,
    @field:NotNull val plannedStart: Instant,
    @field:NotNull val plannedEnd: Instant,
    val actualStart: Instant? = null,
    val actualEnd: Instant? = null,
)

data class UpdateTaskStatusRequest(
    @field:NotNull val statusId: UUID,
)

fun Task.toResponse() = TaskResponse(
    id = id!!,
    projectId = projectId,
    title = title,
    description = description,
    assignee = assignee,
    statusId = statusId,
    plannedStart = plannedStart,
    plannedEnd = plannedEnd,
    actualStart = actualStart,
    actualEnd = actualEnd,
    locked = locked,
    createdBy = createdBy,
    createdAt = createdAt,
)

// ---------- Calendar entries ----------

data class CalendarEntryResponse(
    val id: UUID,
    val title: String,
    val description: String?,
    val start: Instant,
    val end: Instant,
    val projectId: UUID?,
    val userRef: String?,
)

data class CreateCalendarEntryRequest(
    @field:NotBlank val title: String,
    val description: String? = null,
    @field:NotNull val start: Instant,
    @field:NotNull val end: Instant,
    /** Optional project scope; if null the entry is personal to the current user. */
    val projectId: UUID? = null,
)

data class UpdateCalendarEntryRequest(
    @field:NotBlank val title: String,
    val description: String? = null,
    @field:NotNull val start: Instant,
    @field:NotNull val end: Instant,
)

fun CalendarEntry.toResponse() =
    CalendarEntryResponse(id!!, title, description, start, end, projectId, userRef)

// ---------- Calendar feed tokens ----------

data class CreateFeedTokenRequest(
    /** null = personal feed (current user's tasks + entries). */
    val projectId: UUID? = null,
)

data class FeedTokenResponse(
    val id: UUID,
    val token: String,
    val projectId: UUID?,
    val userRef: String?,
    /** Relative path of the subscribable feed, e.g. /api/calendar/{token}.ics */
    val feedPath: String,
)
