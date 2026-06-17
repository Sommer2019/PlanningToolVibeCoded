package de.sommer.planning.web

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.UNAUTHORIZED)
class UnauthorizedException(message: String = "Unauthorized") : RuntimeException(message)

@ResponseStatus(HttpStatus.FORBIDDEN)
class ForbiddenException(message: String = "Forbidden") : RuntimeException(message)

@ResponseStatus(HttpStatus.NOT_FOUND)
class NotFoundException(message: String = "Not found") : RuntimeException(message)

@ResponseStatus(HttpStatus.BAD_REQUEST)
class BadRequestException(message: String = "Bad request") : RuntimeException(message)

@ResponseStatus(HttpStatus.CONFLICT)
class ConflictException(message: String = "Conflict") : RuntimeException(message)
