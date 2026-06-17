package de.sommer.planning.service

import de.sommer.planning.domain.CalendarEntry
import de.sommer.planning.dto.CreateCalendarEntryRequest
import de.sommer.planning.dto.UpdateCalendarEntryRequest
import de.sommer.planning.repo.CalendarEntryRepository
import de.sommer.planning.security.CurrentUser
import de.sommer.planning.web.BadRequestException
import de.sommer.planning.web.ForbiddenException
import de.sommer.planning.web.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class CalendarService(
    private val entries: CalendarEntryRepository,
    private val access: AccessService,
    private val currentUser: CurrentUser,
) {
    fun listForProject(projectId: UUID): List<CalendarEntry> {
        access.requireMember(projectId)
        return entries.findByProjectId(projectId)
    }

    fun listMine(): List<CalendarEntry> =
        entries.findByUserRef(currentUser.userRef())

    @Transactional
    fun create(req: CreateCalendarEntryRequest): CalendarEntry {
        if (req.end.isBefore(req.start)) throw BadRequestException("end must not be before start")
        val me = currentUser.userRef()
        val entry = if (req.projectId != null) {
            access.requireMember(req.projectId)
            CalendarEntry(
                title = req.title,
                description = req.description,
                start = req.start,
                end = req.end,
                projectId = req.projectId,
                userRef = null,
                createdBy = me,
            )
        } else {
            CalendarEntry(
                title = req.title,
                description = req.description,
                start = req.start,
                end = req.end,
                projectId = null,
                userRef = me,
                createdBy = me,
            )
        }
        return entries.save(entry)
    }

    @Transactional
    fun update(id: UUID, req: UpdateCalendarEntryRequest): CalendarEntry {
        if (req.end.isBefore(req.start)) throw BadRequestException("end must not be before start")
        val entry = load(id)
        requireCanEdit(entry)
        entry.title = req.title
        entry.description = req.description
        entry.start = req.start
        entry.end = req.end
        return entries.save(entry)
    }

    @Transactional
    fun delete(id: UUID) {
        val entry = load(id)
        requireCanEdit(entry)
        entries.delete(entry)
    }

    private fun requireCanEdit(entry: CalendarEntry) {
        val id = currentUser.require()
        if (entry.projectId != null) {
            val project = access.requireMember(entry.projectId!!)
            if (!id.admin && entry.createdBy != id.userRef && project.createdBy != id.userRef) {
                throw ForbiddenException("Not allowed to edit this entry")
            }
        } else {
            // personal entry
            if (entry.userRef != id.userRef && !id.admin) {
                throw ForbiddenException("Not allowed to edit this entry")
            }
        }
    }

    private fun load(id: UUID): CalendarEntry =
        entries.findById(id).orElseThrow { NotFoundException("Calendar entry not found") }
}
