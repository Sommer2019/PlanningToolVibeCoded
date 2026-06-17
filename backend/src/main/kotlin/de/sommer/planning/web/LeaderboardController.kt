package de.sommer.planning.web

import de.sommer.planning.dto.LeaderboardEntryResponse
import de.sommer.planning.repo.TaskRepository
import de.sommer.planning.repo.TaskStatusRepository
import de.sommer.planning.service.AccessService
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@Tag(name = "Leaderboard")
class LeaderboardController(
    private val tasks: TaskRepository,
    private val statuses: TaskStatusRepository,
    private val access: AccessService,
) {
    @GetMapping("/cpp-api/planning/projects/{projectId}/leaderboard")
    fun getLeaderboard(@PathVariable projectId: UUID): List<LeaderboardEntryResponse> {
        access.requireMember(projectId)

        // Find the "Done" status (the one with the highest order)
        val projectStatuses = statuses.findByProjectIdOrderByOrderAsc(projectId)
        val globalStatuses = statuses.findByProjectIdIsNullOrderByOrderAsc()
        
        val allStatuses = (globalStatuses + projectStatuses).sortedBy { it.order }
        if (allStatuses.isEmpty()) return emptyList()

        val doneStatusId = allStatuses.last().id!!

        val projectTasks = tasks.findByProjectId(projectId)
        val doneTasks = projectTasks.filter { it.statusId == doneStatusId && it.assignee != null }

        val grouped = doneTasks.groupBy { it.assignee!! }

        return grouped.map { (userRef, userTasks) ->
            LeaderboardEntryResponse(
                userRef = userRef,
                score = userTasks.sumOf { it.difficulty },
                completedTasks = userTasks.size
            )
        }.sortedByDescending { it.score }
    }
}
