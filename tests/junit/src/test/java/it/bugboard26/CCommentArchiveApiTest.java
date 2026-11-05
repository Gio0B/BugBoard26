package it.bugboard26;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CCommentArchiveApiTest extends BaseApiTest {
  private static String issueId;
  private static String commentId;

  @BeforeAll
  static void createIsolatedIssue() throws Exception {
    var response = request("POST", "/issues", Map.of(
      "title", "JUnit archive flow " + System.nanoTime(), "description", "Isolated issue for comment and archive authorization.",
      "type", "QUESTION", "priority", "LOW"), userToken);
    assertEquals(201, response.statusCode(), response.body());
    issueId = json(response).path("issue").path("id").asText();
  }

  @Test @Order(1) void authenticatedUserCanCreateAndReadComment() throws Exception {
    var text = "Real HTTP comment " + System.nanoTime();
    var created = request("POST", "/issues/" + issueId + "/comments", Map.of("text", text), userToken);
    assertEquals(201, created.statusCode(), created.body());
    commentId = json(created).path("comment").path("id").asText();
    var listed = request("GET", "/issues/" + issueId + "/comments", null, userToken);
    assertEquals(200, listed.statusCode());
    assertTrue(containsId(json(listed).path("items"), commentId));
  }

  @Test @Order(2) void everyAuthenticatedRoleCanSetIssueInProgress() throws Exception {
    var userResponse = request("PATCH", "/issues/" + issueId + "/status", Map.of("status", "IN_PROGRESS"), userToken);
    assertEquals(200, userResponse.statusCode(), userResponse.body());
    assertEquals("IN_PROGRESS", json(userResponse).path("issue").path("status").asText());

    var adminResponse = request("PATCH", "/issues/" + issueId + "/status", Map.of("status", "IN_PROGRESS"), adminToken);
    assertEquals(200, adminResponse.statusCode(), adminResponse.body());
    assertEquals("IN_PROGRESS", json(adminResponse).path("issue").path("status").asText());
  }

  @Test @Order(3) void standardUserCannotArchiveIssue() throws Exception {
    var response = request("PATCH", "/issues/" + issueId + "/archive", null, userToken);
    assertEquals(403, response.statusCode());
  }

  @Test @Order(4) void administratorCanArchiveIssue() throws Exception {
    var response = request("PATCH", "/issues/" + issueId + "/archive", null, adminToken);
    assertEquals(200, response.statusCode(), response.body());
    assertTrue(json(response).path("issue").path("archived").asBoolean());
  }

  @Test @Order(5) void archivedIssueLeavesActiveListAndAppearsInDedicatedEndpoint() throws Exception {
    var active = request("GET", "/issues?limit=100", null, userToken);
    var archived = request("GET", "/issues/archived?limit=100", null, userToken);
    assertFalse(containsId(json(active).path("items"), issueId));
    assertTrue(containsId(json(archived).path("items"), issueId));
  }

  @Test @Order(6) void archivePreservesExistingCommentsAndBlocksNewOnes() throws Exception {
    var listed = request("GET", "/issues/" + issueId + "/comments", null, userToken);
    assertEquals(200, listed.statusCode());
    assertTrue(containsId(json(listed).path("items"), commentId));
    var rejected = request("POST", "/issues/" + issueId + "/comments", Map.of("text", "Too late"), userToken);
    assertEquals(409, rejected.statusCode());
    var statusRejected = request("PATCH", "/issues/" + issueId + "/status", Map.of("status", "IN_PROGRESS"), userToken);
    assertEquals(409, statusRejected.statusCode());
  }

  private static boolean containsId(JsonNode items, String id) {
    for (JsonNode item : items) if (id.equals(item.path("id").asText())) return true;
    return false;
  }
}
