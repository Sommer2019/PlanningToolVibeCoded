package com.planningtool.controller

import com.planningtool.dto.*
import com.planningtool.model.User
import com.planningtool.repository.UserRepository
import com.planningtool.service.TaskService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = ["*"])
class TaskController(
    private val taskService: TaskService,
    private val userRepository: UserRepository
) {

    /**
     * Get all tasks for a group (used for Kanban board view).
     */
    @GetMapping
    fun getTasks(
        @RequestParam groupId: Long,
        @RequestHeader("X-User-Id") userId: Long
    ): ResponseEntity<List<TaskResponse>> {
        val user = getCurrentUser(userId)
        return ResponseEntity.ok(taskService.getTasksByGroup(groupId, user))
    }

    /**
     * Get a single task by ID.
     */
    @GetMapping("/{id}")
    fun getTask(
        @PathVariable id: Long,
        @RequestHeader("X-User-Id") userId: Long
    ): ResponseEntity<TaskResponse> {
        val user = getCurrentUser(userId)
        return ResponseEntity.ok(taskService.getTaskById(id, user))
    }

    /**
     * Create a new task.
     */
    @PostMapping
    fun createTask(
        @Valid @RequestBody request: CreateTaskRequest,
        @RequestHeader("X-User-Id") userId: Long
    ): ResponseEntity<TaskResponse> {
        val user = getCurrentUser(userId)
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(request, user))
    }

    /**
     * Update an existing task (title, description, assignee, dates).
     */
    @PutMapping("/{id}")
    fun updateTask(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateTaskRequest,
        @RequestHeader("X-User-Id") userId: Long
    ): ResponseEntity<TaskResponse> {
        val user = getCurrentUser(userId)
        return ResponseEntity.ok(taskService.updateTask(id, request, user))
    }

    /**
     * Update only the status of a task (for Kanban drag & drop).
     */
    @PatchMapping("/{id}/status")
    fun updateTaskStatus(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateTaskStatusRequest,
        @RequestHeader("X-User-Id") userId: Long
    ): ResponseEntity<TaskResponse> {
        val user = getCurrentUser(userId)
        return ResponseEntity.ok(taskService.updateTaskStatus(id, request, user))
    }

    /**
     * Lock or unlock a task.
     */
    @PatchMapping("/{id}/lock")
    fun lockTask(
        @PathVariable id: Long,
        @Valid @RequestBody request: LockTaskRequest,
        @RequestHeader("X-User-Id") userId: Long
    ): ResponseEntity<TaskResponse> {
        val user = getCurrentUser(userId)
        return ResponseEntity.ok(taskService.lockTask(id, request, user))
    }

    /**
     * Delete a task.
     */
    @DeleteMapping("/{id}")
    fun deleteTask(
        @PathVariable id: Long,
        @RequestHeader("X-User-Id") userId: Long
    ): ResponseEntity<Void> {
        val user = getCurrentUser(userId)
        taskService.deleteTask(id, user)
        return ResponseEntity.noContent().build()
    }

    private fun getCurrentUser(userId: Long): User {
        return userRepository.findById(userId)
            .orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found") }
    }
}
