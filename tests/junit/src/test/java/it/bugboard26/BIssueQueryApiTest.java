package it.bugboard26;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class BIssueQueryApiTest extends BaseApiTest {
  @Test @Order(1) void freshEnvironmentContainsExactlyTenSeedIssues() throws Exception {
    var active = request("GET", "/issues?limit=100", null, userToken);
    var archived = request("GET", "/issues/archived?limit=100", null, userToken);
    assertEquals(200, active.statusCode(), active.body());
    assertEquals(200, archived.statusCode(), archived.body());
    assertEquals(10, json(active).path("total").asInt() + json(archived).path("total").asInt());
  }

  @Test @Order(2) void authenticatedUserCanCreateIssue() throws Exception {
    var response = request("POST", "/issues", Map.of(
      "title", "JUnit real API issue " + System.nanoTime(),
      "description", "Created through the running Express API and persisted in the dedicated Neon database.",
      "type", "BUG", "priority", "HIGH"), userToken);
    assertEquals(201, response.statusCode(), response.body());
    assertEquals("TODO", json(response).path("issue").path("status").asText());
    assertEquals(USER_EMAIL, json(response).path("issue").path("author").path("email").asText());
  }

  @Test @Order(3) void issueCreationAcceptsMultipleImagesAndServesTheirBytes() throws Exception {
    byte[] png = Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");
    byte[] gif = Base64.getDecoder().decode("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==");
    var response = multipartRequest("/issues", Map.of(
      "title", "JUnit issue with images " + System.nanoTime(),
      "description", "Two image attachments persisted in the dedicated Neon database.",
      "type", "BUG", "priority", "HIGH"), List.of(
        new ImageUpload("pixel.png", "image/png", png),
        new ImageUpload("pixel.gif", "image/gif", gif)), userToken);
    assertEquals(201, response.statusCode(), new String(response.body()));
    var issue = jsonBytes(response).path("issue");
    assertEquals(2, issue.path("images").size());
    var firstImage = issue.path("images").get(0);
    var download = binaryRequest("/issues/" + issue.path("id").asText()
      + "/images/" + firstImage.path("id").asText(), userToken);
    assertEquals(200, download.statusCode());
    assertEquals(firstImage.path("mimeType").asText(), download.headers().firstValue("Content-Type").orElse(""));
    assertArrayEquals(png, download.body());
  }

  @Test @Order(4) void issueListReturnsOnlyActiveIssues() throws Exception {
    var response = request("GET", "/issues?limit=100", null, userToken);
    assertEquals(200, response.statusCode());
    for (JsonNode issue : json(response).path("items")) assertFalse(issue.path("archived").asBoolean());
  }

  @Test @Order(5) void filtersByTypeStatusAndPriority() throws Exception {
    assertEveryMatches("type", "BUG");
    assertEveryMatches("status", "IN_PROGRESS");
    assertEveryMatches("priority", "CRITICAL");
  }

  @Test @Order(6) void sortsByCreationDateInBothDirections() throws Exception {
    var ascending = json(request("GET", "/issues?limit=100&sortBy=createdAt&direction=asc", null, userToken)).path("items");
    var descending = json(request("GET", "/issues?limit=100&sortBy=createdAt&direction=desc", null, userToken)).path("items");
    assertMonotonicDates(ascending, true);
    assertMonotonicDates(descending, false);
  }

  @Test @Order(7) void sortsByBusinessPriority() throws Exception {
    var items = json(request("GET", "/issues?limit=100&sortBy=priority&direction=desc", null, userToken)).path("items");
    var rank = Map.of("LOW", 1, "MEDIUM", 2, "HIGH", 3, "CRITICAL", 4);
    int previous = Integer.MAX_VALUE;
    for (JsonNode issue : items) {
      int current = rank.get(issue.path("priority").asText());
      assertTrue(current <= previous, "priority order must be descending");
      previous = current;
    }
  }

  private static void assertEveryMatches(String field, String value) throws Exception {
    var response = request("GET", "/issues?limit=100&" + field + "=" + value, null, userToken);
    assertEquals(200, response.statusCode(), response.body());
    assertTrue(json(response).path("items").size() > 0, "seed must exercise " + field + "=" + value);
    for (JsonNode issue : json(response).path("items")) assertEquals(value, issue.path(field).asText());
  }

  private static void assertMonotonicDates(JsonNode items, boolean ascending) {
    Instant previous = null;
    for (JsonNode issue : items) {
      var current = Instant.parse(issue.path("createdAt").asText());
      if (previous != null) assertTrue(ascending ? !current.isBefore(previous) : !current.isAfter(previous));
      previous = current;
    }
  }
}
