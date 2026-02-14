package br.com.infocedro.promocontrol.core.exception;

import org.springframework.http.HttpStatus;

public class BadRequestBusinessException extends BusinessException {

    protected BadRequestBusinessException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
