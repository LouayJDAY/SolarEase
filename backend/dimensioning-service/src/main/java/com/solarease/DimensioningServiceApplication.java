package com.solarease;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class DimensioningServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DimensioningServiceApplication.class, args);
    }

    @Bean
    public RestTemplate restTemplate(@Value("${ollama.timeout-seconds:25}") int ollamaTimeoutSeconds) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(ollamaTimeoutSeconds * 1_000);
        return new RestTemplate(factory);
    }
}
