package de.sommer.planning.security

import de.sommer.planning.config.AppAuthProperties
import org.springframework.core.convert.converter.Converter
import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.oauth2.jwt.Jwt

/**
 * Converts a validated [Jwt] into an authentication whose principal is a
 * [UserIdentity]. Roles are read from the configurable claim (see DECISIONS D2).
 */
class JwtAuthConverter(
    private val props: AppAuthProperties,
) : Converter<Jwt, AbstractAuthenticationToken> {

    override fun convert(jwt: Jwt): AbstractAuthenticationToken {
        val roles = extractRoles(jwt)
        val admin = roles.contains(props.adminRole)
        val identity = UserIdentity(
            subject = jwt.subject,
            displayName = jwt.getClaimAsString("name")
                ?: jwt.getClaimAsString("preferred_username"),
            email = jwt.getClaimAsString("email"),
            roles = roles,
            admin = admin,
        )
        return UsernamePasswordAuthenticationToken(identity, jwt, Roles.authorities(admin))
    }

    /** The roles claim may be a JSON array of strings or a single string. */
    private fun extractRoles(jwt: Jwt): Set<String> {
        return when (val raw = jwt.claims[props.rolesClaim]) {
            is Collection<*> -> raw.mapNotNull { it?.toString() }.toSet()
            is String -> setOf(raw)
            else -> emptySet()
        }
    }
}
