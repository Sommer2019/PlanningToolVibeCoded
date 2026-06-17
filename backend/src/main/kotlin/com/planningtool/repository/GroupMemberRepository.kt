package com.planningtool.repository

import com.planningtool.model.GroupMember
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface GroupMemberRepository : JpaRepository<GroupMember, Long> {
    fun findByUserId(userId: Long): List<GroupMember>
    fun findByGroupId(groupId: Long): List<GroupMember>
    fun findByUserIdAndGroupId(userId: Long, groupId: Long): GroupMember?
    fun existsByUserIdAndGroupId(userId: Long, groupId: Long): Boolean
}
