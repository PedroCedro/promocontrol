package br.com.infocedro.promocontrol.infra.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String BASIC_AUTH_SCHEME = "basicAuth";
    private final String appVersion;

    public OpenApiConfig(@Value("${info.app.version}") String appVersion) {
        this.appVersion = appVersion;
    }

    @Bean
    public OpenAPI promocontrolOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("PromoControl API")
                        .version(appVersion)
                        .description("API para controle de acesso e movimento diario de promotores.")
                        .contact(new Contact().name("InfoCedro Software")))
                .addSecurityItem(new SecurityRequirement().addList(BASIC_AUTH_SCHEME))
                .components(new Components().addSecuritySchemes(
                        BASIC_AUTH_SCHEME,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("basic")));
    }
}
