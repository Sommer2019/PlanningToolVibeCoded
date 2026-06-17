package de.sommer.planning.security

import de.sommer.planning.web.UnauthorizedException
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

/** Convenience access to the authenticated [UserIdentity] for the current request. */
@Component
class CurrentUser {

    fun identityOrNull(): UserIdentity? {
        val auth = SecurityContextHolder.getContext().authentication ?: return null
        return auth.principal as? UserIdentity
    }

    fun require(): UserIdentity =
        identityOrNull() ?: throw UnauthorizedException("No authenticated user")

    fun isAdmin(): Boolean = require().admin

    fun userRef(): String = require().userRef
}
