package it.bugboard26;

import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AAuthenticationApiTest extends BaseApiTest {
  @Test @Order(1) void validLoginReturnsUserAndJwt() throws Exception {
    var response = request("POST", "/auth/login", Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD), null);
    assertEquals(200, response.statusCode());
    assertEquals("ADMIN", json(response).path("user").path("role").asText());
    assertFalse(json(response).path("accessToken").asText().isBlank());
  }

  @Test @Order(2) void invalidLoginDoesNotRevealWhichCredentialFailed() throws Exception {
    var response = request("POST", "/auth/login", Map.of("email", ADMIN_EMAIL, "password", "definitely-wrong"), null);
    assertEquals(401, response.statusCode());
    assertEquals("AUTHENTICATION_REQUIRED", json(response).path("error").path("code").asText());
  }

  @Test @Order(3) void protectedEndpointRejectsMissingToken() throws Exception {
    var response = request("GET", "/issues", null, null);
    assertEquals(401, response.statusCode());
  }

  @Test @Order(4) void administratorCanCreateUser() throws Exception {
    var email = "junit-admin-created-" + System.nanoTime() + "@bugboard26.local";
    var response = request("POST", "/users", Map.of("email", email, "password", "Junit26-Strong-Pass", "role", "USER"), adminToken);
    assertEquals(201, response.statusCode(), response.body());
    assertEquals(email, json(response).path("user").path("email").asText());
  }

  @Test @Order(5) void standardUserCannotCreateUser() throws Exception {
    var response = request("POST", "/users", Map.of("email", "denied-" + System.nanoTime() + "@bugboard26.local", "password", "Junit26-Strong-Pass", "role", "USER"), userToken);
    assertEquals(403, response.statusCode());
  }
}
