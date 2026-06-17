package com.planningtool.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {

    @Bean
    fun customOpenAPI(): OpenAPI {
        return OpenAPI()
            .info(
                Info()
                    .title("Planning Tool API")
                    .description("API for the Uni Student Collaboration & Planning Platform – Task management, Kanban board, and Calendar")
                    .version("1.0.0")
            )
    }
}
