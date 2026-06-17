package de.sommer.planning.web

import de.sommer.planning.domain.CalendarFeedToken
import de.sommer.planning.dto.CreateFeedTokenRequest
import de.sommer.planning.dto.FeedTokenResponse
import de.sommer.planning.service.CalendarFeedService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/cpp-api/planning/calendar")
@Tag(name = "Calendar feed")
class CalendarFeedController(
    private val feeds: CalendarFeedService,
) {
    @GetMapping("/feed-tokens")
    fun list(): List<FeedTokenResponse> = feeds.listMine().map { it.toResponse() }

    @PostMapping("/feed-tokens")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create (or fetch existing) feed token for the current user / project")
    fun create(@RequestBody req: CreateFeedTokenRequest): FeedTokenResponse =
        feeds.getOrCreate(req.projectId).toResponse()

    @DeleteMapping("/feed-tokens/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = feeds.delete(id)

    /** Public, read-only iCal feed. The token in the URL is the credential. */
    @GetMapping("/{token}.ics", produces = ["text/calendar;charset=UTF-8"])
    @Operation(summary = "Subscribable iCal feed (no auth header; token authenticates)")
    fun feed(@PathVariable token: String): ResponseEntity<String> {
        val body = feeds.renderFeed(token)
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"planning.ics\"")
            .contentType(MediaType.parseMediaType("text/calendar;charset=UTF-8"))
            .body(body)
    }
}

private fun CalendarFeedToken.toResponse() = FeedTokenResponse(
    id = id!!,
    token = token,
    projectId = projectId,
    userRef = userRef,
    feedPath = "/cpp-api/planning/calendar/$token.ics",
)
