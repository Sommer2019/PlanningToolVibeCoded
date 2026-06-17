package de.sommer.planning.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * Fixed mock identities used when [de.sommer.planning.config.AppAuthProperties.mock]
 * is on. See DECISIONS D3. NEVER active in production.
 */
object MockUsers {
    const val HEADER = "X-Mock-User"
    const val DEFAULT = "TestAdmin"

    private val users: Map<String, UserIdentity> = listOf(
        UserIdentity("TestAdmin", "Test Admin", "testadmin@example.com", setOf("planning-admin"), admin = true),
        UserIdentity("TestUser1", "Test User 1", "testuser1@example.com", setOf("planning-user"), admin = false),
        UserIdentity("TestUser2", "Test User 2", "testuser2@example.com", setOf("planning-user"), admin = false),
        UserIdentity("TestUser3", "Test User 3", "testuser3@example.com", setOf("planning-user"), admin = false),
    ).associateBy { it.subject }

    fun byName(name: String?): UserIdentity? = name?.let { users[it] }

    fun all(): List<UserIdentity> = users.values.toList()
}

/**
 * Injects a mock identity based on the [MockUsers.HEADER] header (or `?mockUser=`
 * query param). Missing -> default TestAdmin. Unknown -> left unauthenticated.
 */
@Component
@ConditionalOnProperty(prefix = "app.auth", name = ["mock"], havingValue = "true")
class MockAuthFilter : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val requested = request.getHeader(MockUsers.HEADER) ?: request.getParameter("mockUser")
        val identity = when {
            requested == null -> MockUsers.byName(MockUsers.DEFAULT)
            else -> MockUsers.byName(requested)
        }
        if (identity != null) {
            val auth = UsernamePasswordAuthenticationToken(
                identity, "mock", Roles.authorities(identity.admin),
            )
            SecurityContextHolder.getContext().authentication = auth
        }
        filterChain.doFilter(request, response)
    }
}
