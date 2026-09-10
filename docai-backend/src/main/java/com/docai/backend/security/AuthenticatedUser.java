package com.docai.backend.security;

public record AuthenticatedUser(Long userId, String email) {
}
