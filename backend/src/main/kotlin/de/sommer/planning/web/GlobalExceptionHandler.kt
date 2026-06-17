package de.sommer.planning.web

import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.Instant

data class ApiError(
    val timestamp: Instant,
    val status: Int,
    val error: String,
    val message: String?,
    val path: String,
    val fieldErrors: Map<String, String>? = null,
)

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(UnauthorizedException::class)
    fun unauthorized(ex: UnauthorizedException, req: HttpServletRequest) =
        build(HttpStatus.UNAUTHORIZED, ex.message, req)

    @ExceptionHandler(ForbiddenException::class)
    fun forbidden(ex: ForbiddenException, req: HttpServletRequest) =
        build(HttpStatus.FORBIDDEN, ex.message, req)

    @ExceptionHandler(NotFoundException::class)
    fun notFound(ex: NotFoundException, req: HttpServletRequest) =
        build(HttpStatus.NOT_FOUND, ex.message, req)

    @ExceptionHandler(BadRequestException::class)
    fun badRequest(ex: BadRequestException, req: HttpServletRequest) =
        build(HttpStatus.BAD_REQUEST, ex.message, req)

    @ExceptionHandler(ConflictException::class)
    fun conflict(ex: ConflictException, req: HttpServletRequest) =
        build(HttpStatus.CONFLICT, ex.message, req)

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun validation(ex: MethodArgumentNotValidException, req: HttpServletRequest): ResponseEntity<ApiError> {
        val fieldErrors = ex.bindingResult.fieldErrors.associate {
            it.field to (it.defaultMessage ?: "invalid")
        }
        val body = ApiError(
            timestamp = Instant.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = HttpStatus.BAD_REQUEST.reasonPhrase,
            message = "Validation failed",
            path = req.requestURI,
            fieldErrors = fieldErrors,
        )
        return ResponseEntity.badRequest().body(body)
    }

    private fun build(status: HttpStatus, message: String?, req: HttpServletRequest): ResponseEntity<ApiError> =
        ResponseEntity.status(status).body(
            ApiError(
                timestamp = Instant.now(),
                status = status.value(),
                error = status.reasonPhrase,
                message = message,
                path = req.requestURI,
            ),
        )
}
