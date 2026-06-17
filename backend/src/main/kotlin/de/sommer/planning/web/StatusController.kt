package de.sommer.planning.web

import de.sommer.planning.dto.CreateStatusRequest
import de.sommer.planning.dto.StatusResponse
import de.sommer.planning.dto.UpdateStatusRequest
import de.sommer.planning.dto.toResponse
import de.sommer.planning.service.StatusService
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
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/statuses")
@Tag(name = "Statuses")
class StatusController(
    private val statuses: StatusService,
) {
    /** Effective status list: global defaults + (optional) project-scoped. */
    @GetMapping
    fun list(@RequestParam(required = false) projectId: UUID?): List<StatusResponse> =
        statuses.effectiveStatuses(projectId).map { it.toResponse() }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody req: CreateStatusRequest): StatusResponse =
        statuses.create(req).toResponse()

    @PutMapping("/{id}")
    fun update(@PathVariable id: UUID, @Valid @RequestBody req: UpdateStatusRequest): StatusResponse =
        statuses.update(id, req).toResponse()

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = statuses.delete(id)
}
