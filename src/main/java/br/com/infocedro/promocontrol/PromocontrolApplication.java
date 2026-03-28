package br.com.infocedro.promocontrol;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PromocontrolApplication {

	public static void main(String[] args) {
		start(args);
	}

	public static ConfigurableApplicationContext start(String[] args) {
		return SpringApplication.run(PromocontrolApplication.class, args);
	}

	public static void stop(ConfigurableApplicationContext context) {
		if (context == null) {
			return;
		}
		SpringApplication.exit(context);
		context.close();
	}

}
