package de.sommer.planning.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.info.License
import io.swagger.v3.oas.models.security.SecurityScheme
import io.swagger.v3.oas.models.Components
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {

    @Bean
    fun planningOpenApi(): OpenAPI =
        OpenAPI()
            .info(
                Info()
                    .title("Planning & Tracking Module API")
                    .description(
                        "REST API for the Planning & Tracking module: projects, memberships, " +
                            "tasks, configurable statuses, calendar and iCal feed. " +
                            "Auth via Authentik JWT (or mock mode in dev).",
                    )
                    .version("0.1.0")
                    .license(License().name("Internal")),
            )
            .components(
                Components().addSecuritySchemes(
                    "bearer-jwt",
                    SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT"),
                ),
            )
}
