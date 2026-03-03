package br.com.infocedro.promocontrol;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PromocontrolApplication {

	public static void main(String[] args) {
		SpringApplication.run(PromocontrolApplication.class, args);
	}

}
