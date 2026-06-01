# Build stage
FROM maven:3.9.15-eclipse-temurin-26 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -Dmaven.test.skip=true

# Run stage
FROM eclipse-temurin:17-jre
WORKDIR /app
RUN apt-get update \
	&& apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-fra \
	&& rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
