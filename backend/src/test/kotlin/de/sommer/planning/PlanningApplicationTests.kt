package de.sommer.planning

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class PlanningApplicationTests : AbstractIntegrationTest() {

    @Test
    fun contextLoads() {
        val res = request("GET", "/actuator/health")
        assertEquals(200, res.statusCode())
    }
}
