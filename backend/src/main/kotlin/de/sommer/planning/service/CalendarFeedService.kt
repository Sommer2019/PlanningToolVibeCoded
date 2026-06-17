package de.sommer.planning.service

import de.sommer.planning.calendar.CalEvent
import de.sommer.planning.calendar.ICalService
import de.sommer.planning.domain.CalendarFeedToken
import de.sommer.planning.repo.CalendarEntryRepository
import de.sommer.planning.repo.CalendarFeedTokenRepository
import de.sommer.planning.repo.TaskRepository
import de.sommer.planning.security.CurrentUser
import de.sommer.planning.web.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.util.Base64
import java.util.UUID

@Service
class CalendarFeedService(
    private val feedTokens: CalendarFeedTokenRepository,
    private val tasks: TaskRepository,
    private val entries: CalendarEntryRepository,
    private val ical: ICalService,
    private val access: AccessService,
    private val currentUser: CurrentUser,
) {
    private val random = SecureRandom()

    fun listMine(): List<CalendarFeedToken> =
        feedTokens.findByUserRef(currentUser.userRef())

    /** Get or create the feed token for (current user, optional project). */
    @Transactional
    fun getOrCreate(projectId: UUID?): CalendarFeedToken {
        val me = currentUser.userRef()
        if (projectId != null) {
            access.requireMember(projectId)
            feedTokens.findByUserRefAndProjectId(me, projectId)?.let { return it }
        } else {
            feedTokens.findByUserRefAndProjectIdIsNull(me)?.let { return it }
        }
        return feedTokens.save(
            CalendarFeedToken(token = newToken(), userRef = me, projectId = projectId),
        )
    }

    @Transactional
    fun delete(id: UUID) {
        val me = currentUser.require()
        val token = feedTokens.findById(id).orElseThrow { NotFoundException("Feed token not found") }
        if (token.userRef != me.userRef && !me.admin) throw NotFoundException("Feed token not found")
        feedTokens.delete(token)
    }

    /** Render the iCal document for a feed token (public, token is the credential). */
    fun renderFeed(token: String): String {
        val feed = feedTokens.findByToken(token) ?: throw NotFoundException("Unknown feed token")
        val events = mutableListOf<CalEvent>()

        if (feed.projectId != null) {
            tasks.findByProjectId(feed.projectId!!).forEach { events.add(it.toEvent()) }
            entries.findByProjectId(feed.projectId!!).forEach { events.add(it.toEvent()) }
        } else if (feed.userRef != null) {
            tasks.findByAssignee(feed.userRef!!).forEach { events.add(it.toEvent()) }
            entries.findByUserRef(feed.userRef!!).forEach { events.add(it.toEvent()) }
        }
        return ical.render(events)
    }

    private fun newToken(): String {
        val bytes = ByteArray(24)
        random.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private fun de.sommer.planning.domain.Task.toEvent() = CalEvent(
        uid = "task-$id@planning.sommer2019.de",
        summary = title,
        description = description,
        start = plannedStart,
        end = plannedEnd,
    )

    private fun de.sommer.planning.domain.CalendarEntry.toEvent() = CalEvent(
        uid = "entry-$id@planning.sommer2019.de",
        summary = title,
        description = description,
        start = start,
        end = end,
    )
}
