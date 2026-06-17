package com.planningtool.service

import com.planningtool.model.Task
import com.planningtool.model.User
import com.planningtool.model.UserRole
import com.planningtool.repository.GroupMemberRepository
import org.springframework.stereotype.Service

@Service
class PermissionService(
    private val groupMemberRepository: GroupMemberRepository
) {

    /**
     * Check if a user is a member of a group (or is an admin).
     */
    fun isGroupMember(userId: Long, groupId: Long): Boolean {
        return groupMemberRepository.existsByUserIdAndGroupId(userId, groupId)
    }

    /**
     * Check if a user is an admin.
     */
    fun isAdmin(user: User): Boolean {
        return user.role == UserRole.ADMIN
    }

    /**
     * Check if a user can access a group's resources.
     * Admins can access all groups; members can only access their own groups.
     */
    fun canAccessGroup(user: User, groupId: Long): Boolean {
        return isAdmin(user) || isGroupMember(user.id, groupId)
    }

    /**
     * Check if a user can edit a task.
     * Locked tasks can only be edited by the person who locked it or an admin.
     */
    fun canEditTask(user: User, task: Task): Boolean {
        if (!canAccessGroup(user, task.group.id)) return false
        if (task.isLocked) {
            return task.lockedBy?.id == user.id || isAdmin(user)
        }
        return true
    }

    /**
     * Check if a user can lock/unlock a task.
     * Only the task creator, assignee, or admin can lock/unlock.
     */
    fun canLockTask(user: User, task: Task): Boolean {
        if (!canAccessGroup(user, task.group.id)) return false
        return task.createdBy.id == user.id
                || task.assignee?.id == user.id
                || isAdmin(user)
    }
}
