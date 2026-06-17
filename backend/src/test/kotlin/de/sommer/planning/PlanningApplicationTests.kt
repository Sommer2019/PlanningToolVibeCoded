package de.sommer.planning

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class PlanningApplicationTests : AbstractIntegrationTest() {

    @Test
    fun contextLoads() {
        val res = request("GET", "/actuator/health")
        assertEquals(200, res.statusCode())
    }

    @Test
    fun `gateway health endpoint returns status ok`() {
        val res = request("GET", "/health")
        assertEquals(200, res.statusCode())
        assertTrue(res.body().contains("\"status\":\"ok\""), "unexpected body: ${res.body()}")
    }
}
