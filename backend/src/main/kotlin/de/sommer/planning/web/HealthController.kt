package de.sommer.planning.web

import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Gateway/monitoring health check per the CPP team convention:
 * `GET /health -> 200 {"status":"ok"}`. Public (no auth). Distinct from the
 * richer Spring Boot Actuator health at /actuator/health.
 */
@RestController
@Tag(name = "Health")
class HealthController {

    @GetMapping("/health", "/planning/health", "/cpp-api/planning/health")
    fun health(): Map<String, String> = mapOf("status" to "ok")
}
