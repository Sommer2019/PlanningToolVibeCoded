package de.sommer.planning.config

import de.sommer.planning.security.AudienceValidator
import de.sommer.planning.security.JwtAuthConverter
import de.sommer.planning.security.MockAuthFilter
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.ObjectProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator
import org.springframework.security.oauth2.core.OAuth2TokenValidator
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtDecoders
import org.springframework.security.oauth2.jwt.JwtValidators
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableMethodSecurity
class SecurityConfig(
    private val authProps: AppAuthProperties,
    private val corsProps: AppCorsProperties,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Bean
    fun securityFilterChain(
        http: HttpSecurity,
        mockFilter: ObjectProvider<MockAuthFilter>,
    ): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .cors { it.configurationSource(corsConfigurationSource()) }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Gateway health check (CPP convention) + Actuator health.
                it.requestMatchers("/health", "/actuator/health/**", "/actuator/info").permitAll()
                // OpenAPI spec + Swagger UI.
                it.requestMatchers("/openapi.json", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                // The iCal feed authenticates via the token in the URL, not a header.
                it.requestMatchers(HttpMethod.GET, "/api/planning/calendar/*.ics").permitAll()
                it.requestMatchers("/api/planning/**").authenticated()
                it.anyRequest().permitAll()
            }

        if (authProps.mock) {
            log.warn(
                "############ APP_AUTH_MOCK IS ON — JWT validation is bypassed. " +
                    "This must NEVER be used in production. ############",
            )
            http.addFilterBefore(
                mockFilter.getObject(),
                UsernamePasswordAuthenticationFilter::class.java,
            )
        } else {
            http.oauth2ResourceServer { rs ->
                rs.jwt { jwt ->
                    jwt.decoder(jwtDecoder())
                    jwt.jwtAuthenticationConverter(JwtAuthConverter(authProps))
                }
            }
        }
        return http.build()
    }

    /** Built only in prod (non-mock). Requires a reachable issuer for JWKS discovery. */
    private fun jwtDecoder(): JwtDecoder {
        val issuer = authProps.issuerUri?.takeIf { it.isNotBlank() }
            ?: throw IllegalStateException(
                "app.auth.issuer-uri must be set when not running in mock mode",
            )
        val decoder = JwtDecoders.fromIssuerLocation(issuer) as NimbusJwtDecoder
        val validators = mutableListOf<OAuth2TokenValidator<Jwt>>(
            JwtValidators.createDefaultWithIssuer(issuer),
        )
        authProps.audience?.takeIf { it.isNotBlank() }?.let {
            validators.add(AudienceValidator(it))
        }
        decoder.setJwtValidator(DelegatingOAuth2TokenValidator(validators))
        return decoder
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration().apply {
            allowedOrigins = corsProps.allowedOrigins
            allowedMethods = listOf("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            allowedHeaders = listOf("*")
            allowCredentials = false
            maxAge = 3600
        }
        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", config)
        }
    }
}
