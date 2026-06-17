package de.sommer.planning.web

import de.sommer.planning.config.AppAuthProperties
import de.sommer.planning.security.CurrentUser
import de.sommer.planning.security.MockUsers
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class MeResponse(
    val subject: String,
    val displayName: String?,
    val email: String?,
    val roles: Set<String>,
    val admin: Boolean,
)

data class MockUserResponse(
    val subject: String,
    val displayName: String?,
    val admin: Boolean,
)

@RestController
@RequestMapping("/api")
@Tag(name = "Identity")
class MeController(
    private val currentUser: CurrentUser,
    private val authProps: AppAuthProperties,
) {
    @GetMapping("/me")
    @Operation(summary = "Current authenticated identity")
    fun me(): MeResponse {
        val id = currentUser.require()
        return MeResponse(id.subject, id.displayName, id.email, id.roles, id.admin)
    }

    @GetMapping("/auth/mock-users")
    @Operation(summary = "List available mock identities (empty unless mock mode is on)")
    fun mockUsers(): List<MockUserResponse> =
        if (authProps.mock) {
            MockUsers.all().map { MockUserResponse(it.subject, it.displayName, it.admin) }
        } else {
            emptyList()
        }
}
