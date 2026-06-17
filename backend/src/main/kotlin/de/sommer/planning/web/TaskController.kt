package de.sommer.planning.web

import de.sommer.planning.dto.CreateTaskRequest
import de.sommer.planning.dto.TaskResponse
import de.sommer.planning.dto.UpdateTaskRequest
import de.sommer.planning.dto.UpdateTaskStatusRequest
import de.sommer.planning.dto.toResponse
import de.sommer.planning.service.TaskService
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@Tag(name = "Tasks")
class TaskController(
    private val tasks: TaskService,
) {
    @GetMapping("/api/projects/{projectId}/tasks")
    fun listByProject(@PathVariable projectId: UUID): List<TaskResponse> =
        tasks.listByProject(projectId).map { it.toResponse() }

    @PostMapping("/api/projects/{projectId}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @PathVariable projectId: UUID,
        @Valid @RequestBody req: CreateTaskRequest,
    ): TaskResponse = tasks.create(projectId, req).toResponse()

    /** Per-user Kanban board. scope=me (default) or scope=all (admin/owner). */
    @GetMapping("/api/projects/{projectId}/board")
    fun board(
        @PathVariable projectId: UUID,
        @RequestParam(defaultValue = "me") scope: String,
    ): List<TaskResponse> =
        tasks.board(projectId, scopeAll = scope.equals("all", ignoreCase = true)).map { it.toResponse() }

    @GetMapping("/api/tasks/{id}")
    fun get(@PathVariable id: UUID): TaskResponse = tasks.get(id).toResponse()

    @PutMapping("/api/tasks/{id}")
    fun update(@PathVariable id: UUID, @Valid @RequestBody req: UpdateTaskRequest): TaskResponse =
        tasks.update(id, req).toResponse()

    @PatchMapping("/api/tasks/{id}/status")
    fun updateStatus(
        @PathVariable id: UUID,
        @Valid @RequestBody req: UpdateTaskStatusRequest,
    ): TaskResponse = tasks.updateStatus(id, req.statusId).toResponse()

    @PostMapping("/api/tasks/{id}/lock")
    fun lock(@PathVariable id: UUID): TaskResponse = tasks.setLocked(id, true).toResponse()

    @PostMapping("/api/tasks/{id}/unlock")
    fun unlock(@PathVariable id: UUID): TaskResponse = tasks.setLocked(id, false).toResponse()

    @DeleteMapping("/api/tasks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = tasks.delete(id)
}
