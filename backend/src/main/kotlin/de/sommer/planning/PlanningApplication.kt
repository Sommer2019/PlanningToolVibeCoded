package de.sommer.planning

import de.sommer.planning.config.AppAuthProperties
import de.sommer.planning.config.AppCorsProperties
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication

@SpringBootApplication
@EnableConfigurationProperties(AppAuthProperties::class, AppCorsProperties::class)
class PlanningApplication

fun main(args: Array<String>) {
    runApplication<PlanningApplication>(*args)
}
