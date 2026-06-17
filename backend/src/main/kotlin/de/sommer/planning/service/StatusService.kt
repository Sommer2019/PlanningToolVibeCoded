package de.sommer.planning.service

import de.sommer.planning.domain.TaskStatus
import de.sommer.planning.dto.CreateStatusRequest
import de.sommer.planning.dto.UpdateStatusRequest
import de.sommer.planning.repo.TaskRepository
import de.sommer.planning.repo.TaskStatusRepository
import de.sommer.planning.web.ConflictException
import de.sommer.planning.web.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class StatusService(
    private val statuses: TaskStatusRepository,
    private val tasks: TaskRepository,
    private val access: AccessService,
) {
    /**
     * Effective status list for a project = global defaults + project-scoped,
     * sorted by order. If [projectId] is null, only the global ones.
     */
    fun effectiveStatuses(projectId: UUID?): List<TaskStatus> {
        val global = statuses.findByProjectIdIsNullOrderByOrderAsc()
        val scoped = projectId?.let { statuses.findByProjectIdOrderByOrderAsc(it) } ?: emptyList()
        return (global + scoped).sortedBy { it.order }
    }

    @Transactional
    fun create(req: CreateStatusRequest): TaskStatus {
        if (req.projectId == null) {
            access.requireGlobalAdmin()
        } else {
            access.requireProjectAdmin(req.projectId)
        }
        val order = req.order ?: nextOrder(req.projectId)
        return statuses.save(
            TaskStatus(name = req.name, projectId = req.projectId, order = order, isDefault = false),
        )
    }

    @Transactional
    fun update(id: UUID, req: UpdateStatusRequest): TaskStatus {
        val status = load(id)
        authorize(status)
        status.name = req.name
        if (req.order != null) status.order = req.order
        return statuses.save(status)
    }

    @Transactional
    fun delete(id: UUID) {
        val status = load(id)
        authorize(status)
        if (status.isDefault) throw ConflictException("Cannot delete a default status")
        if (tasks.countByStatusId(id) > 0) throw ConflictException("Status is in use by tasks")
        statuses.delete(status)
    }

    private fun authorize(status: TaskStatus) {
        if (status.projectId == null) access.requireGlobalAdmin()
        else access.requireProjectAdmin(status.projectId!!)
    }

    private fun nextOrder(projectId: UUID?): Int =
        (effectiveStatuses(projectId).maxOfOrNull { it.order } ?: -1) + 1

    private fun load(id: UUID): TaskStatus =
        statuses.findById(id).orElseThrow { NotFoundException("Status not found") }

    fun requireExists(statusId: UUID): TaskStatus = load(statusId)
}
