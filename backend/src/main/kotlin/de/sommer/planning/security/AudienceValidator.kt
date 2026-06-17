package de.sommer.planning.security

import org.springframework.security.oauth2.core.OAuth2Error
import org.springframework.security.oauth2.core.OAuth2TokenValidator
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult
import org.springframework.security.oauth2.jwt.Jwt

/** Validates that the JWT's audience contains the expected value. */
class AudienceValidator(
    private val expectedAudience: String,
) : OAuth2TokenValidator<Jwt> {

    override fun validate(token: Jwt): OAuth2TokenValidatorResult =
        if (token.audience.contains(expectedAudience)) {
            OAuth2TokenValidatorResult.success()
        } else {
            OAuth2TokenValidatorResult.failure(
                OAuth2Error("invalid_token", "Required audience '$expectedAudience' is missing", null),
            )
        }
}
