package de.sommer.planning.web

import de.sommer.planning.dto.AddMemberRequest
import de.sommer.planning.dto.MembershipResponse
import de.sommer.planning.dto.toResponse
import de.sommer.planning.service.MembershipService
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
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
@RequestMapping("/api/projects/{projectId}")
@Tag(name = "Memberships")
class MembershipController(
    private val memberships: MembershipService,
) {
    @GetMapping("/members")
    fun list(@PathVariable projectId: UUID): List<MembershipResponse> =
        memberships.list(projectId).map { it.toResponse() }

    @PostMapping("/members")
    @ResponseStatus(HttpStatus.CREATED)
    fun add(
        @PathVariable projectId: UUID,
        @Valid @RequestBody req: AddMemberRequest,
    ): MembershipResponse = memberships.addMember(projectId, req).toResponse()

    @PostMapping("/join-request")
    @ResponseStatus(HttpStatus.CREATED)
    fun requestJoin(@PathVariable projectId: UUID): MembershipResponse =
        memberships.requestJoin(projectId).toResponse()

    @GetMapping("/join-requests")
    fun listRequests(@PathVariable projectId: UUID): List<MembershipResponse> =
        memberships.listRequests(projectId).map { it.toResponse() }

    @PostMapping("/members/{membershipId}/approve")
    fun approve(
        @PathVariable projectId: UUID,
        @PathVariable membershipId: UUID,
    ): MembershipResponse = memberships.approve(projectId, membershipId).toResponse()

    @DeleteMapping("/members/{membershipId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun remove(@PathVariable projectId: UUID, @PathVariable membershipId: UUID) =
        memberships.remove(projectId, membershipId)
}
