package com.planningtool.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "calendar_entries")
data class CalendarEntry(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    var title: String = "",

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(nullable = false)
    var start: LocalDateTime = LocalDateTime.now(),

    @Column(name = "end_time", nullable = false)
    var end: LocalDateTime = LocalDateTime.now(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    val group: Group = Group(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    val createdBy: User = User(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    var task: Task? = null,

    @Column(nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
