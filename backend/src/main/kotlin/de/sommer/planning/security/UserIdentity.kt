package de.sommer.planning.security

import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority

object Roles {
    const val ADMIN = "ROLE_ADMIN"
    const val USER = "ROLE_USER"

    fun authorities(admin: Boolean): List<GrantedAuthority> =
        if (admin) {
            listOf(SimpleGrantedAuthority(ADMIN), SimpleGrantedAuthority(USER))
        } else {
            listOf(SimpleGrantedAuthority(USER))
        }
}

/**
 * Normalized identity for the current request, derived from a JWT (prod) or a
 * mock identity (dev). This is the Spring Security principal in both modes, so
 * [de.sommer.planning.security.CurrentUser] can treat them uniformly.
 */
data class UserIdentity(
    /** Stable user reference = JWT subject (sub). */
    val subject: String,
    val displayName: String?,
    val email: String?,
    /** Raw role/group values from the token claim. */
    val roles: Set<String>,
    val admin: Boolean,
) {
    /** What we persist as userRef on tasks/memberships/etc. */
    val userRef: String get() = subject
}
