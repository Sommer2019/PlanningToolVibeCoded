package de.sommer.planning

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

private const val TODO_STATUS = "00000000-0000-0000-0000-000000000001"

class CalendarFeedTest : AbstractIntegrationTest() {

    @Test
    fun `project iCal feed exposes tasks as VEVENTs`() {
        val pid = field(request("POST", "/api/planning/projects", """{"name":"Calendar"}""", "TestUser1"), "id")

        val taskBody = """
            {
              "title": "Release planning",
              "description": "Plan the release",
              "assignee": "TestUser1",
              "statusId": "$TODO_STATUS",
              "plannedStart": "2026-07-01T09:00:00Z",
              "plannedEnd": "2026-07-01T10:00:00Z"
            }
        """.trimIndent()
        assertEquals(201, request("POST", "/api/planning/projects/$pid/tasks", taskBody, "TestUser1").statusCode())

        val tokenRes = request("POST", "/api/planning/calendar/feed-tokens", """{"projectId":"$pid"}""", "TestUser1")
        assertEquals(201, tokenRes.statusCode())
        val feedPath = field(tokenRes, "feedPath")

        // The feed is public (token authenticates) — no mock user header needed.
        val ics = request("GET", feedPath)
        assertEquals(200, ics.statusCode())
        val body = ics.body()
        assertTrue(body.contains("BEGIN:VCALENDAR"), "missing VCALENDAR")
        assertTrue(body.contains("BEGIN:VEVENT"), "missing VEVENT")
        assertTrue(body.contains("Release planning"), "missing task summary")
    }
}
