package de.sommer.planning.config

import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * Auth configuration. See docs/DECISIONS.md (D2, D3).
 *
 * - [mock] bypasses JWT validation and uses fixed test identities. NEVER in prod.
 * - [rolesClaim] / [adminRole] make the Authentik role mapping configurable, since
 *   the exact claim was not known at build time.
 */
@ConfigurationProperties(prefix = "app.auth")
data class AppAuthProperties(
    /** Bypass JWT and use fixed mock identities (X-Mock-User header). Default off. */
    val mock: Boolean = false,
    /** OIDC issuer URI (Authentik). Drives JWKS discovery in prod. */
    val issuerUri: String? = null,
    /** Expected JWT audience (optional but recommended). */
    val audience: String? = null,
    /** JWT claim that holds the role/group list. */
    val rolesClaim: String = "groups",
    /** Value inside [rolesClaim] that grants the ADMIN role. */
    val adminRole: String = "planning-admin",
)

@ConfigurationProperties(prefix = "app.cors")
data class AppCorsProperties(
    /** Comma-separated list of allowed origins for the SPA. */
    val allowedOrigins: List<String> = listOf("http://localhost:5173"),
)
