package it.bugboard26;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

abstract class BaseApiTest {
  protected static final ObjectMapper JSON = new ObjectMapper();
  protected static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
  protected static final String API = required("TEST_API_BASE_URL");
  protected static final String ADMIN_EMAIL = required("DEMO_ADMIN_EMAIL");
  protected static final String ADMIN_PASSWORD = required("DEMO_ADMIN_PASSWORD");
  protected static final String USER_EMAIL = required("DEMO_USER_EMAIL");
  protected static final String USER_PASSWORD = required("DEMO_USER_PASSWORD");
  protected static String adminToken;
  protected static String userToken;

  @BeforeAll
  static void verifyEnvironmentAndAuthenticate() throws Exception {
    assertFalse(required("TEST_DATABASE_URL").isBlank(), "TEST_DATABASE_URL must identify the dedicated Neon test database");
    var health = request("GET", "/health", null, null);
    assertEquals(200, health.statusCode(), health.body());
    adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    userToken = login(USER_EMAIL, USER_PASSWORD);
  }

  protected static String required(String name) {
    var value = System.getenv(name);
    if (value == null || value.isBlank()) throw new IllegalStateException(name + " is required for real API integration tests");
    return value;
  }

  protected static String login(String email, String password) throws Exception {
    var response = request("POST", "/auth/login", Map.of("email", email, "password", password), null);
    assertEquals(200, response.statusCode(), response.body());
    return json(response).path("accessToken").asText();
  }

  protected static HttpResponse<String> request(String method, String path, Object body, String token) throws Exception {
    var builder = HttpRequest.newBuilder(URI.create(API + path)).timeout(Duration.ofSeconds(20)).header("Accept", "application/json");
    if (token != null) builder.header("Authorization", "Bearer " + token);
    if (body == null) builder.method(method, HttpRequest.BodyPublishers.noBody());
    else builder.header("Content-Type", "application/json").method(method, HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
    return HTTP.send(builder.build(), HttpResponse.BodyHandlers.ofString());
  }

  protected record ImageUpload(String fileName, String mimeType, byte[] data) {}

  protected static HttpResponse<byte[]> multipartRequest(String path, Map<String, String> fields,
      List<ImageUpload> images, String token) throws Exception {
    var boundary = "----BugBoard26JUnit" + System.nanoTime();
    var body = new ByteArrayOutputStream();
    for (var field : fields.entrySet()) {
      writeUtf8(body, "--" + boundary + "\r\n"
        + "Content-Disposition: form-data; name=\"" + field.getKey() + "\"\r\n\r\n"
        + field.getValue() + "\r\n");
    }
    for (var image : images) {
      writeUtf8(body, "--" + boundary + "\r\n"
        + "Content-Disposition: form-data; name=\"images\"; filename=\"" + image.fileName() + "\"\r\n"
        + "Content-Type: " + image.mimeType() + "\r\n\r\n");
      body.writeBytes(image.data());
      writeUtf8(body, "\r\n");
    }
    writeUtf8(body, "--" + boundary + "--\r\n");
    var builder = HttpRequest.newBuilder(URI.create(API + path)).timeout(Duration.ofSeconds(30))
      .header("Accept", "application/json")
      .header("Content-Type", "multipart/form-data; boundary=" + boundary)
      .header("Authorization", "Bearer " + token)
      .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()));
    return HTTP.send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
  }

  protected static HttpResponse<byte[]> binaryRequest(String path, String token) throws Exception {
    var request = HttpRequest.newBuilder(URI.create(API + path)).timeout(Duration.ofSeconds(20))
      .header("Authorization", "Bearer " + token).GET().build();
    return HTTP.send(request, HttpResponse.BodyHandlers.ofByteArray());
  }

  private static void writeUtf8(ByteArrayOutputStream output, String value) {
    output.writeBytes(value.getBytes(StandardCharsets.UTF_8));
  }

  protected static JsonNode json(HttpResponse<String> response) throws Exception { return JSON.readTree(response.body()); }
  protected static JsonNode jsonBytes(HttpResponse<byte[]> response) throws Exception { return JSON.readTree(response.body()); }
}
