package de.sommer.planning

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Testcontainers
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

/**
 * Base for integration tests. Boots the full app in the `mock` profile against a
 * Testcontainers Postgres on a random port, and drives it over real HTTP with the
 * JDK HttpClient. Identities are selected via the `X-Mock-User` header.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("mock")
@Testcontainers
abstract class AbstractIntegrationTest {

    @Value("\${local.server.port}")
    protected var port: Int = 0

    private val client: HttpClient = HttpClient.newHttpClient()

    protected fun request(
        method: String,
        path: String,
        body: String? = null,
        user: String? = null,
    ): HttpResponse<String> {
        val builder = HttpRequest.newBuilder(URI.create("http://localhost:$port$path"))
        if (user != null) builder.header("X-Mock-User", user)
        val publisher = if (body != null) {
            builder.header("Content-Type", "application/json")
            HttpRequest.BodyPublishers.ofString(body)
        } else {
            HttpRequest.BodyPublishers.noBody()
        }
        builder.method(method, publisher)
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString())
    }

    /** Extracts the first `"name":"value"` string field from a JSON body. */
    protected fun field(res: HttpResponse<String>, name: String): String {
        val match = Regex("\"$name\"\\s*:\\s*\"([^\"]+)\"").find(res.body())
            ?: error("field '$name' not found in: ${res.body()}")
        return match.groupValues[1]
    }

    companion object {
        @JvmStatic
        private val postgres: PostgreSQLContainer<*> =
            PostgreSQLContainer("postgres:16-alpine").apply {
                withDatabaseName("planning")
                withUsername("planning")
                withPassword("planning")
                start()
            }

        @JvmStatic
        @DynamicPropertySource
        fun props(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
        }
    }
}
