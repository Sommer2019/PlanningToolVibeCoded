package de.sommer.planning

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

private const val TODO_STATUS = "00000000-0000-0000-0000-000000000001"
private const val IN_PROGRESS_STATUS = "00000000-0000-0000-0000-000000000002"

class TaskApiTest : AbstractIntegrationTest() {

    private fun createProject(user: String, name: String): String {
        val res = request("POST", "/cpp-api/planning/projects", """{"name":"$name"}""", user)
        assertEquals(201, res.statusCode())
        return field(res, "id")
    }

    private fun taskBody(statusId: String = TODO_STATUS, title: String = "Task A", assignee: String = "TestUser1") =
        """
        {
          "title": "$title",
          "description": "Do the thing",
          "assignee": "$assignee",
          "statusId": "$statusId",
          "plannedStart": "2026-07-01T09:00:00Z",
          "plannedEnd": "2026-07-02T17:00:00Z"
        }
        """.trimIndent()

    @Test
    fun `task lifecycle and per-user board`() {
        val pid = createProject("TestUser1", "Lifecycle")

        val created = request("POST", "/cpp-api/planning/projects/$pid/tasks", taskBody(), "TestUser1")
        assertEquals(201, created.statusCode())
        val taskId = field(created, "id")

        // Per-user board for TestUser1 shows the assigned task.
        val board = request("GET", "/cpp-api/planning/projects/$pid/board", user = "TestUser1")
        assertEquals(200, board.statusCode())
        assertTrue(board.body().contains(taskId))

        // Drag&drop status change.
        val patched = request("PATCH", "/cpp-api/planning/tasks/$taskId/status", """{"statusId":"$IN_PROGRESS_STATUS"}""", "TestUser1")
        assertEquals(200, patched.statusCode())

        val task = request("GET", "/cpp-api/planning/tasks/$taskId", user = "TestUser1")
        assertEquals(IN_PROGRESS_STATUS, field(task, "statusId"))
    }

    @Test
    fun `required fields are validated server-side`() {
        val pid = createProject("TestUser1", "Validation")
        val res = request("POST", "/cpp-api/planning/projects/$pid/tasks", taskBody(title = ""), "TestUser1")
        assertEquals(400, res.statusCode())
    }

    @Test
    fun `non-member cannot access project tasks`() {
        val pid = createProject("TestUser1", "Private")
        val res = request("GET", "/cpp-api/planning/projects/$pid/tasks", user = "TestUser2")
        assertEquals(403, res.statusCode())
    }

    @Test
    fun `locked task editable only by admin or creator`() {
        val pid = createProject("TestUser1", "Locking")
        // Owner adds TestUser2 as member.
        val add = request("POST", "/cpp-api/planning/projects/$pid/members", """{"userRef":"TestUser2"}""", "TestUser1")
        assertEquals(201, add.statusCode())

        val created = request("POST", "/cpp-api/planning/projects/$pid/tasks", taskBody(), "TestUser1")
        val taskId = field(created, "id")

        // Admin locks it.
        assertEquals(200, request("POST", "/cpp-api/planning/tasks/$taskId/lock", user = "TestAdmin").statusCode())

        // A member who is not the creator cannot edit.
        val forbidden = request("PUT", "/cpp-api/planning/tasks/$taskId", taskBody(title = "Hacked"), "TestUser2")
        assertEquals(403, forbidden.statusCode())

        // The creator still can.
        val ok = request("PUT", "/cpp-api/planning/tasks/$taskId", taskBody(title = "Edited by creator"), "TestUser1")
        assertEquals(200, ok.statusCode())
    }

    @Test
    fun `admin can add project status and tasks can use it`() {
        val pid = createProject("TestUser1", "Statuses")

        val statusRes = request("POST", "/cpp-api/planning/statuses", """{"name":"Review","projectId":"$pid"}""", "TestAdmin")
        assertEquals(201, statusRes.statusCode())
        val reviewId = field(statusRes, "id")

        // Effective list contains defaults + the new project status.
        val list = request("GET", "/cpp-api/planning/statuses?projectId=$pid", user = "TestUser1").body()
        assertTrue(
            listOf("Todo", "In Progress", "Done", "Review").all { list.contains("\"$it\"") },
            "status list missing entries: $list",
        )

        val taskRes = request("POST", "/cpp-api/planning/projects/$pid/tasks", taskBody(statusId = reviewId), "TestUser1")
        assertEquals(201, taskRes.statusCode())
    }

    @Test
    fun `non-admin cannot create global status`() {
        val res = request("POST", "/cpp-api/planning/statuses", """{"name":"Blocked"}""", "TestUser1")
        assertEquals(403, res.statusCode())
    }
}
