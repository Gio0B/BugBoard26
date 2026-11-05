package it.bugboard26;

import org.junit.jupiter.api.Test;

import java.net.URI;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class DSeedIsolationApiTest extends BaseApiTest {
  private static final Set<String> SEED_ISSUE_IDS = Set.of(
    "26100000-0000-4000-8000-000000000001", "26100000-0000-4000-8000-000000000002",
    "26100000-0000-4000-8000-000000000003", "26100000-0000-4000-8000-000000000004",
    "26100000-0000-4000-8000-000000000005", "26100000-0000-4000-8000-000000000006",
    "26100000-0000-4000-8000-000000000007", "26100000-0000-4000-8000-000000000008",
    "26100000-0000-4000-8000-000000000009", "26100000-0000-4000-8000-000000000010"
  );

  @Test void applicationAndTestDatabaseTargetsAreDifferent() {
    var application = databaseIdentity(required("APPLICATION_DATABASE_URL"));
    var test = databaseIdentity(required("TEST_DATABASE_URL"));
    assertNotEquals(application, test, "JUnit must never run against the application database");
  }

  @Test void allTenStableSeedIssuesRemainResolvableAfterRepeatedSeed() throws Exception {
    for (String id : SEED_ISSUE_IDS) {
      var response = request("GET", "/issues/" + id, null, userToken);
      assertEquals(200, response.statusCode(), "missing stable seed issue " + id + ": " + response.body());
      assertEquals(id, json(response).path("issue").path("id").asText());
    }
  }

  @Test void repeatedSeedPreservesSeededCommentRelationship() throws Exception {
    var response = request("GET", "/issues/26100000-0000-4000-8000-000000000001/comments", null, userToken);
    assertEquals(200, response.statusCode());
    assertEquals(2, json(response).path("items").size());
  }

  private static String databaseIdentity(String value) {
    var uri = URI.create(value.replaceFirst("^postgresql:", "http:").replaceFirst("^postgres:", "http:"));
    return uri.getHost().toLowerCase() + ":" + (uri.getPort() < 0 ? 5432 : uri.getPort()) + uri.getPath();
  }
}
