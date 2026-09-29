package com.incidentmanagement.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * API metadata shown in Swagger UI at /swagger-ui.html.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI incidentOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Incident Management API")
                .version("1.0.0")
                .description("""
                        Create, search, update, close and delete incidents.

                        Rules: incident numbers are unique; a CLOSED incident requires a detailed analysis \
                        (close date defaults to today); the close date cannot be before the creation date; \
                        re-opening an incident clears its close date."""));
    }
}
