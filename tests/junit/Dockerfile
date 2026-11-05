FROM maven:3.9.12-eclipse-temurin-21
WORKDIR /workspace
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY src ./src
CMD ["mvn", "-B", "test"]
