package com.planningtool.service

import com.planningtool.dto.*
import com.planningtool.model.Task
import com.planningtool.model.TaskStatus
import com.planningtool.model.User
import com.planningtool.repository.GroupRepository
import com.planningtool.repository.TaskRepository
import com.planningtool.repository.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDateTime

@Service
class TaskService(
    private val taskRepository: TaskRepository,
    private val userRepository: UserRepository,
    private val groupRepository: GroupRepository,
    private val permissionService: PermissionService
) {

    fun getTasksByGroup(groupId: Long, currentUser: User): List<TaskResponse> {
        if (!permissionService.canAccessGroup(currentUser, groupId)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this group")
        }
        return taskRepository.findByGroupId(groupId).map { TaskResponse.from(it) }
    }

    fun getTaskById(taskId: Long, currentUser: User): TaskResponse {
        val task = findTaskOrThrow(taskId)
        if (!permissionService.canAccessGroup(currentUser, task.group.id)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this task")
        }
        return TaskResponse.from(task)
    }

    fun createTask(request: CreateTaskRequest, currentUser: User): TaskResponse {
        if (!permissionService.canAccessGroup(currentUser, request.groupId)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this group")
        }

        val group = groupRepository.findById(request.groupId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found") }

        val assignee = request.assigneeId?.let {
            userRepository.findById(it)
                .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Assignee not found") }
        }

        val task = Task(
            title = request.title,
            description = request.description,
            assignee = assignee,
            createdBy = currentUser,
            group = group,
            status = TaskStatus.TODO,
            plannedStart = request.plannedStart,
            plannedEnd = request.plannedEnd
        )

        return TaskResponse.from(taskRepository.save(task))
    }

    fun updateTask(taskId: Long, request: UpdateTaskRequest, currentUser: User): TaskResponse {
        val task = findTaskOrThrow(taskId)

        if (!permissionService.canEditTask(currentUser, task)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot edit this task")
        }

        val assignee = request.assigneeId?.let {
            userRepository.findById(it)
                .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Assignee not found") }
        }

        task.title = request.title
        task.description = request.description
        task.assignee = assignee
        task.plannedStart = request.plannedStart
        task.plannedEnd = request.plannedEnd
        task.updatedAt = LocalDateTime.now()

        return TaskResponse.from(taskRepository.save(task))
    }

    fun updateTaskStatus(taskId: Long, request: UpdateTaskStatusRequest, currentUser: User): TaskResponse {
        val task = findTaskOrThrow(taskId)

        if (!permissionService.canEditTask(currentUser, task)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot edit this task")
        }

        val newStatus = try {
            TaskStatus.valueOf(request.status.uppercase())
        } catch (e: IllegalArgumentException) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status. Valid values: TODO, IN_PROGRESS, DONE")
        }

        task.status = newStatus
        task.updatedAt = LocalDateTime.now()

        return TaskResponse.from(taskRepository.save(task))
    }

    fun lockTask(taskId: Long, request: LockTaskRequest, currentUser: User): TaskResponse {
        val task = findTaskOrThrow(taskId)

        if (!permissionService.canLockTask(currentUser, task)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot lock/unlock this task")
        }

        task.isLocked = request.isLocked
        task.lockedBy = if (request.isLocked) currentUser else null
        task.updatedAt = LocalDateTime.now()

        return TaskResponse.from(taskRepository.save(task))
    }

    fun deleteTask(taskId: Long, currentUser: User) {
        val task = findTaskOrThrow(taskId)

        if (!permissionService.canEditTask(currentUser, task)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete this task")
        }

        taskRepository.delete(task)
    }

    private fun findTaskOrThrow(taskId: Long): Task {
        return taskRepository.findById(taskId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found") }
    }
}
