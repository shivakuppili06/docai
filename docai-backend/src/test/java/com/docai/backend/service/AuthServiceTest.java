package com.docai.backend.service;

import com.docai.backend.dto.AuthDtos.LoginRequest;
import com.docai.backend.dto.AuthDtos.RegisterRequest;
import com.docai.backend.dto.AuthDtos.AuthResponse;
import com.docai.backend.model.User;
import com.docai.backend.repository.UserRepository;
import com.docai.backend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_success() {
        RegisterRequest req = new RegisterRequest("test@test.com", "password", "Test User");
        when(userRepository.existsByEmail("test@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encoded");
        
        User savedUser = User.builder()
            .id(1L)
            .email("test@test.com")
            .passwordHash("encoded")
            .fullName("Test User")
            .build();
            
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtil.generateToken("test@test.com", 1L)).thenReturn("jwt-token");

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertEquals("jwt-token", resp.token());
        assertEquals("test@test.com", resp.email());
        assertEquals("Test User", resp.fullName());
    }

    @Test
    void register_emailExists() {
        RegisterRequest req = new RegisterRequest("test@test.com", "password", "Test User");
        when(userRepository.existsByEmail("test@test.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_success() {
        LoginRequest req = new LoginRequest("test@test.com", "password");
        User user = User.builder().id(1L).email("test@test.com").passwordHash("encoded").fullName("Test User").build();
        
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "encoded")).thenReturn(true);
        when(jwtUtil.generateToken("test@test.com", 1L)).thenReturn("jwt-token");

        AuthResponse resp = authService.login(req);

        assertEquals("jwt-token", resp.token());
        assertEquals("Test User", resp.fullName());
    }

    @Test
    void login_invalidPassword() {
        LoginRequest req = new LoginRequest("test@test.com", "password");
        User user = User.builder().id(1L).email("test@test.com").passwordHash("encoded").build();
        
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "encoded")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> authService.login(req));
    }
}
