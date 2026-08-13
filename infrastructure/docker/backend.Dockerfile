FROM eclipse-temurin:17-jdk-alpine AS build

WORKDIR /app
COPY pom.xml .
COPY src ./src

RUN apk add --no-cache maven && \
  mvn clean package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
