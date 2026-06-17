package com.planningtool.model

import jakarta.persistence.*

@Entity
@Table(name = "group_members", uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "group_id"])])
data class GroupMember(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User = User(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    val group: Group = Group(),

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val role: GroupRole = GroupRole.MEMBER
)

enum class GroupRole {
    OWNER, MEMBER
}
