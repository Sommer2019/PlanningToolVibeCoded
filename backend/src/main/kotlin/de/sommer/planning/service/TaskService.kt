package de.sommer.planning.service

import de.sommer.planning.domain.Task
import de.sommer.planning.dto.CreateTaskRequest
import de.sommer.planning.dto.UpdateTaskRequest
import de.sommer.planning.repo.TaskRepository
import de.sommer.planning.repo.TaskStatusRepository
import de.sommer.planning.security.CurrentUser
import de.sommer.planning.web.BadRequestException
import de.sommer.planning.web.ForbiddenException
import de.sommer.planning.web.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class TaskService(
    private val tasks: TaskRepository,
    private val statuses: TaskStatusRepository,
    private val access: AccessService,
    private val currentUser: CurrentUser,
) {
    fun listByProject(projectId: UUID): List<Task> {
        access.requireMember(projectId)
        return tasks.findByProjectId(projectId)
    }

    /**
     * Per-user board (DECISIONS D4): tasks assigned to the current user in the
     * project. Admins/owners may request the full project board via [scopeAll].
     */
    fun board(projectId: UUID, scopeAll: Boolean): List<Task> {
        access.requireMember(projectId)
        if (scopeAll) {
            return tasks.findByProjectId(projectId)
        }
        val me = currentUser.userRef()
        return tasks.findByProjectIdAndAssignee(projectId, me)
    }

    fun get(taskId: UUID): Task {
        val task = load(taskId)
        access.requireMember(task.projectId)
        return task
    }

    @Transactional
    fun create(projectId: UUID, req: CreateTaskRequest): Task {
        access.requireMember(projectId)
        if (req.assignee != null) access.requireIsMember(projectId, req.assignee)
        validateDates(req.plannedStart, req.plannedEnd, req.actualStart, req.actualEnd)
        validateStatus(req.statusId, projectId)
        val task = Task(
            projectId = projectId,
            title = req.title,
            description = req.description,
            assignee = req.assignee,
            statusId = req.statusId,
            plannedStart = req.plannedStart,
            plannedEnd = req.plannedEnd,
            actualStart = req.actualStart,
            actualEnd = req.actualEnd,
            difficulty = req.difficulty,
            createdBy = currentUser.userRef(),
        )
        return tasks.save(task)
    }

    @Transactional
    fun update(taskId: UUID, req: UpdateTaskRequest): Task {
        val task = load(taskId)
        access.requireCanEditTask(task)
        if (req.assignee != null) access.requireIsMember(task.projectId, req.assignee)
        validateDates(req.plannedStart, req.plannedEnd, req.actualStart, req.actualEnd)
        validateStatus(req.statusId, task.projectId)
        task.title = req.title
        task.description = req.description
        task.assignee = req.assignee
        task.statusId = req.statusId
        task.plannedStart = req.plannedStart
        task.plannedEnd = req.plannedEnd
        task.actualStart = req.actualStart
        task.actualEnd = req.actualEnd
        task.difficulty = req.difficulty
        return tasks.save(task)
    }

    @Transactional
    fun updateStatus(taskId: UUID, statusId: UUID): Task {
        val task = load(taskId)
        access.requireCanEditTask(task)
        validateStatus(statusId, task.projectId)
        
        val status = statuses.findById(statusId).get()
        if (status.order == 1 && task.actualStart == null) {
            task.actualStart = java.time.Instant.now()
        } else if (status.order >= 2 && task.actualEnd == null) {
            if (task.actualStart == null) task.actualStart = java.time.Instant.now()
            task.actualEnd = java.time.Instant.now()
        }
        
        task.statusId = statusId
        return tasks.save(task)
    }

    @Transactional
    fun setLocked(taskId: UUID, locked: Boolean): Task {
        val task = load(taskId)
        val id = currentUser.require()
        if (!id.admin && task.createdBy != id.userRef) {
            access.requireProjectAdmin(task.projectId)
        }
        task.locked = locked
        return tasks.save(task)
    }

    @Transactional
    fun delete(taskId: UUID) {
        val task = load(taskId)
        val id = currentUser.require()
        if (!id.admin && task.createdBy != id.userRef) {
            throw ForbiddenException("Only admin or the creator can delete a task")
        }
        if (task.locked && !id.admin) {
            throw ForbiddenException("Task is locked")
        }
        tasks.delete(task)
    }

    private fun load(taskId: UUID): Task =
        tasks.findById(taskId).orElseThrow { NotFoundException("Task not found") }

    private fun validateDates(
        plannedStart: java.time.Instant,
        plannedEnd: java.time.Instant,
        actualStart: java.time.Instant?,
        actualEnd: java.time.Instant?,
    ) {
        if (plannedEnd.isBefore(plannedStart)) {
            throw BadRequestException("plannedEnd must not be before plannedStart")
        }
        if (actualStart != null && actualEnd != null && actualEnd.isBefore(actualStart)) {
            throw BadRequestException("actualEnd must not be before actualStart")
        }
    }

    /** Status must exist and be either global or belong to this project. */
    private fun validateStatus(statusId: UUID, projectId: UUID) {
        val status = statuses.findById(statusId)
            .orElseThrow { BadRequestException("Unknown statusId") }
        if (status.projectId != null && status.projectId != projectId) {
            throw BadRequestException("Status does not belong to this project")
        }
    }
}
