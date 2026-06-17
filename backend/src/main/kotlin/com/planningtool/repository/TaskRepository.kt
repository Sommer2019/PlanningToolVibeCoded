package com.planningtool.repository

import com.planningtool.model.Task
import com.planningtool.model.TaskStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface TaskRepository : JpaRepository<Task, Long> {
    fun findByGroupId(groupId: Long): List<Task>
    fun findByAssigneeId(assigneeId: Long): List<Task>
    fun findByGroupIdAndStatus(groupId: Long, status: TaskStatus): List<Task>
    fun findByAssigneeIdAndGroupId(assigneeId: Long, groupId: Long): List<Task>
}
