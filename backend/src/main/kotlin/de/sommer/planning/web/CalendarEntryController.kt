package de.sommer.planning.web

import de.sommer.planning.dto.CalendarEntryResponse
import de.sommer.planning.dto.CreateCalendarEntryRequest
import de.sommer.planning.dto.UpdateCalendarEntryRequest
import de.sommer.planning.dto.toResponse
import de.sommer.planning.service.CalendarService
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
@RequestMapping("/cpp-api/planning/calendar-entries")
@Tag(name = "Calendar entries")
class CalendarEntryController(
    private val calendar: CalendarService,
) {
    /** projectId given -> project entries (member); omitted -> current user's personal entries. */
    @GetMapping
    fun list(@RequestParam(required = false) projectId: UUID?): List<CalendarEntryResponse> =
        if (projectId != null) {
            calendar.listForProject(projectId).map { it.toResponse() }
        } else {
            calendar.listMine().map { it.toResponse() }
        }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody req: CreateCalendarEntryRequest): CalendarEntryResponse =
        calendar.create(req).toResponse()

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody req: UpdateCalendarEntryRequest,
    ): CalendarEntryResponse = calendar.update(id, req).toResponse()

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = calendar.delete(id)
}
