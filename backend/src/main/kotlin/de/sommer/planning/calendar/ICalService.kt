package de.sommer.planning.calendar

import net.fortuna.ical4j.data.CalendarOutputter
import net.fortuna.ical4j.model.Calendar
import net.fortuna.ical4j.model.DateTime
import net.fortuna.ical4j.model.component.VEvent
import net.fortuna.ical4j.model.property.CalScale
import net.fortuna.ical4j.model.property.Description
import net.fortuna.ical4j.model.property.Method
import net.fortuna.ical4j.model.property.ProdId
import net.fortuna.ical4j.model.property.Uid
import net.fortuna.ical4j.model.property.Version
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.time.Instant
import java.util.Date

/** A single event to render into the iCal feed. */
data class CalEvent(
    val uid: String,
    val summary: String,
    val description: String?,
    val start: Instant,
    val end: Instant,
)

/** Renders an RFC 5545 iCalendar document from [CalEvent]s using ical4j. */
@Service
class ICalService {

    fun render(events: List<CalEvent>): String {
        val calendar = Calendar()
        calendar.properties.add(ProdId("-//Sommer2019//Planning Module//EN"))
        calendar.properties.add(Version.VERSION_2_0)
        calendar.properties.add(CalScale.GREGORIAN)
        calendar.properties.add(Method.PUBLISH)

        for (e in events) {
            val start = DateTime(Date.from(e.start)).apply { isUtc = true }
            val end = DateTime(Date.from(e.end)).apply { isUtc = true }
            val event = VEvent(start, end, e.summary)
            event.properties.add(Uid(e.uid))
            if (!e.description.isNullOrBlank()) {
                event.properties.add(Description(e.description))
            }
            calendar.components.add(event)
        }

        ByteArrayOutputStream().use { out ->
            // Validation disabled: our events are minimal but well-formed.
            CalendarOutputter(false).output(calendar, out)
            return out.toString(Charsets.UTF_8)
        }
    }
}
