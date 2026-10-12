package com.docai.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
            @Email @NotBlank @Size(max = 255) String email,
            @NotBlank @Size(min = 8, max = 128) String password,
            @NotBlank @Size(min = 2, max = 100) String fullName
    ) {}

    public record LoginRequest(
            @Email @NotBlank @Size(max = 255) String email,
            @NotBlank @Size(max = 128) String password
    ) {}

    public record AuthResponse(
            String token,
            String email,
            String fullName
    ) {}
}
