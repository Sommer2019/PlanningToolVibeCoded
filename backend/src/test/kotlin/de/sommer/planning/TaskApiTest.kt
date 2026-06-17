package de.sommer.planning

import com.fasterxml.jackson.databind.JsonNode
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put

private const val TODO_STATUS = "00000000-0000-0000-0000-000000000001"
private const val IN_PROGRESS_STATUS = "00000000-0000-0000-0000-000000000002"

class TaskApiTest : AbstractIntegrationTest() {

    private fun MockMvc.createProject(user: String, name: String): String {
        val res = post("/api/projects") {
            header("X-Mock-User", user)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"$name"}"""
        }.andReturn().response.contentAsString
        return objectMapper.readTree(res)["id"].asText()
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
        val pid = mockMvc.createProject("TestUser1", "Lifecycle")

        val created = mockMvc.post("/api/projects/$pid/tasks") {
            header("X-Mock-User", "TestUser1")
            contentType = MediaType.APPLICATION_JSON
            content = taskBody()
        }.andExpect { status { isCreated() } }.andReturn().response.contentAsString
        val taskId = objectMapper.readTree(created)["id"].asText()

        // Per-user board for TestUser1 shows the assigned task.
        val board = mockMvc.get("/api/projects/$pid/board") {
            header("X-Mock-User", "TestUser1")
        }.andExpect { status { isOk() } }.andReturn().response.contentAsString
        val ids = objectMapper.readTree(board).map { it["id"].asText() }
        assertTrue(taskId in ids)

        // Drag&drop status change.
        mockMvc.patch("/api/tasks/$taskId/status") {
            header("X-Mock-User", "TestUser1")
            contentType = MediaType.APPLICATION_JSON
            content = """{"statusId":"$IN_PROGRESS_STATUS"}"""
        }.andExpect { status { isOk() } }

        val task = mockMvc.get("/api/tasks/$taskId") {
            header("X-Mock-User", "TestUser1")
        }.andReturn().response.contentAsString
        assertEquals(IN_PROGRESS_STATUS, objectMapper.readTree(task)["statusId"].asText())
    }

    @Test
    fun `required fields are validated server-side`() {
        val pid = mockMvc.createProject("TestUser1", "Validation")
        mockMvc.post("/api/projects/$pid/tasks") {
            header("X-Mock-User", "TestUser1")
            contentType = MediaType.APPLICATION_JSON
            content = taskBody(title = "")
        }.andExpect { status { isBadRequest() } }
    }

    @Test
    fun `non-member cannot access project tasks`() {
        val pid = mockMvc.createProject("TestUser1", "Private")
        mockMvc.get("/api/projects/$pid/tasks") {
            header("X-Mock-User", "TestUser2")
        }.andExpect { status { isForbidden() } }
    }

    @Test
    fun `locked task editable only by admin or creator`() {
        val pid = mockMvc.createProject("TestUser1", "Locking")
        // Owner adds TestUser2 as member.
        mockMvc.post("/api/projects/$pid/members") {
            header("X-Mock-User", "TestUser1")
            contentType = MediaType.APPLICATION_JSON
            content = """{"userRef":"TestUser2"}"""
        }.andExpect { status { isCreated() } }

        val created = mockMvc.post("/api/projects/$pid/tasks") {
            header("X-Mock-User", "TestUser1")
            contentType = MediaType.APPLICATION_JSON
            content = taskBody()
        }.andReturn().response.contentAsString
        val taskId = objectMapper.readTree(created)["id"].asText()

        // Admin locks it.
        mockMvc.post("/api/tasks/$taskId/lock") {
            header("X-Mock-User", "TestAdmin")
        }.andExpect { status { isOk() } }

        // A member who is not the creator cannot edit.
        mockMvc.put("/api/tasks/$taskId") {
            header("X-Mock-User", "TestUser2")
            contentType = MediaType.APPLICATION_JSON
            content = taskBody(title = "Hacked")
        }.andExpect { status { isForbidden() } }

        // The creator still can.
        mockMvc.put("/api/tasks/$taskId") {
            header("X-Mock-User", "TestUser1")
            contentType = MediaType.APPLICATION_JSON
            content = taskBody(title = "Edited by creator")
        }.andExpect { status { isOk() } }
    }

    @Test
    fun `admin can add project status and tasks can use it`() {
        val pid = mockMvc.createProject("TestUser1", "Statuses")

        val statusRes = mockMvc.post("/api/statuses") {
            header("X-Mock-User", "TestAdmin")
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Review","projectId":"$pid"}"""
        }.andExpect { status { isCreated() } }.andReturn().response.contentAsString
        val reviewId = objectMapper.readTree(statusRes)["id"].asText()

        // Effective list contains defaults + the new project status.
        val list: JsonNode = objectMapper.readTree(
            mockMvc.get("/api/statuses?projectId=$pid") {
                header("X-Mock-User", "TestUser1")
            }.andReturn().response.contentAsString,
        )
        val names = list.map { it["name"].asText() }
        assertTrue(names.containsAll(listOf("Todo", "In Progress", "Done", "Review")))

        mockMvc.post("/api/projects/$pid/tasks") {
            header("X-Mock-User", "TestUser1")
            contentType = MediaType.APPLICATION_JSON
            content = taskBody(statusId = reviewId)
        }.andExpect { status { isCreated() } }
    }

    @Test
    fun `non-admin cannot create global status`() {
        mockMvc.post("/api/statuses") {
            header("X-Mock-User", "TestUser1")
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Blocked"}"""
        }.andExpect { status { isForbidden() } }
    }
}
