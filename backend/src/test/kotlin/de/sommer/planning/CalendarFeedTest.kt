package de.sommer.planning

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

private const val TODO_STATUS = "00000000-0000-0000-0000-000000000001"

class CalendarFeedTest : AbstractIntegrationTest() {

    @Test
    fun `project iCal feed exposes tasks as VEVENTs`() {
        val pid = objectMapper.readTree(
            mockMvc.post("/api/projects") {
                header("X-Mock-User", "TestUser1")
                contentType = MediaType.APPLICATION_JSON
                content = """{"name":"Calendar"}"""
            }.andReturn().response.contentAsString,
        )["id"].asText()

        mockMvc.post("/api/projects/$pid/tasks") {
            header("X-Mock-User", "TestUser1")
            contentType = MediaType.APPLICATION_JSON
            content = """
                {
                  "title": "Release planning",
                  "description": "Plan the release",
                  "assignee": "TestUser1",
                  "statusId": "$TODO_STATUS",
                  "plannedStart": "2026-07-01T09:00:00Z",
                  "plannedEnd": "2026-07-01T10:00:00Z"
                }
            """.trimIndent()
        }.andExpect { status { isCreated() } }

        val tokenRes = mockMvc.post("/api/calendar/feed-tokens") {
            header("X-Mock-User", "TestUser1")
            contentType = MediaType.APPLICATION_JSON
            content = """{"projectId":"$pid"}"""
        }.andExpect { status { isCreated() } }.andReturn().response.contentAsString
        val feedPath = objectMapper.readTree(tokenRes)["feedPath"].asText()

        // The feed is public (token authenticates) — no mock user header needed.
        val ics = mockMvc.get(feedPath)
            .andExpect { status { isOk() } }
            .andReturn().response.contentAsString

        assertTrue(ics.contains("BEGIN:VCALENDAR"), "missing VCALENDAR")
        assertTrue(ics.contains("BEGIN:VEVENT"), "missing VEVENT")
        assertTrue(ics.contains("Release planning"), "missing task summary")
    }
}
