package de.sommer.planning

import org.junit.jupiter.api.Test
import org.springframework.test.web.servlet.get

class PlanningApplicationTests : AbstractIntegrationTest() {

    @Test
    fun contextLoads() {
        // The default statuses are seeded by Flyway and returned publicly to members.
        mockMvc.get("/actuator/health").andExpect {
            status { isOk() }
        }
    }
}
