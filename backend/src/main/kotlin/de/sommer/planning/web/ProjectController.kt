package de.sommer.planning.web

import de.sommer.planning.dto.CreateProjectRequest
import de.sommer.planning.dto.ProjectResponse
import de.sommer.planning.dto.UpdateProjectRequest
import de.sommer.planning.dto.toResponse
import de.sommer.planning.service.ProjectService
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/projects")
@Tag(name = "Projects")
class ProjectController(
    private val projects: ProjectService,
) {
    @GetMapping
    fun list(): List<ProjectResponse> = projects.listVisible().map { it.toResponse() }

    @GetMapping("/{id}")
    fun get(@PathVariable id: UUID): ProjectResponse = projects.get(id).toResponse()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody req: CreateProjectRequest): ProjectResponse =
        projects.create(req).toResponse()

    @PutMapping("/{id}")
    fun update(@PathVariable id: UUID, @Valid @RequestBody req: UpdateProjectRequest): ProjectResponse =
        projects.update(id, req).toResponse()

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = projects.delete(id)
}
