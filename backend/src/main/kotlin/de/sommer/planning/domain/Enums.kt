package de.sommer.planning.domain

/** Membership lifecycle. See DECISIONS D5. */
enum class MembershipStatus {
    /** Active member of the project. */
    MEMBER,

    /** User asked to join; awaiting approval by an admin/owner. */
    REQUESTED,
}
