package br.com.infocedro.promocontrol.core.exception;

import org.springframework.http.HttpStatus;

public class NotFoundBusinessException extends BusinessException {

    protected NotFoundBusinessException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
