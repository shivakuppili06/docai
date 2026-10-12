package com.docai.backend.interceptor;

import com.docai.backend.dto.ErrorResponse;
import com.docai.backend.security.AuthenticatedUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.time.Duration;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final com.docai.backend.config.RateLimitProperties rateLimitProps;

    public RateLimitInterceptor(StringRedisTemplate redisTemplate, ObjectMapper objectMapper, com.docai.backend.config.RateLimitProperties rateLimitProps) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.rateLimitProps = rateLimitProps;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        
        String key = "ratelimit:";
        long limit = 100; // default
        long window = 60; // default 60s
        
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register")) {
            key += "auth:" + getClientIp(request);
            limit = rateLimitProps.getAuthLimit();
            window = rateLimitProps.getAuthWindow();
        } else if (path.startsWith("/api/documents") && "POST".equalsIgnoreCase(request.getMethod())) {
            key += "upload:" + getUserId();
            limit = rateLimitProps.getUploadLimit();
            window = rateLimitProps.getUploadWindow();
        } else if (path.startsWith("/api/chat")) {
            key += "chat:" + getUserId();
            limit = rateLimitProps.getChatLimit();
            window = rateLimitProps.getChatWindow();
        } else {
            // General API limit
            key += "api:" + getUserId();
            limit = rateLimitProps.getApiLimit();
            window = rateLimitProps.getApiWindow();
        }
        
        Long current = redisTemplate.opsForValue().increment(key);
        if (current != null && current == 1) {
            redisTemplate.expire(key, Duration.ofSeconds(window));
        }
        
        if (current != null && current > limit) {
            sendErrorResponse(request, response);
            return false;
        }

        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
    
    private String getUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthenticatedUser) {
            return String.valueOf(((AuthenticatedUser) auth.getPrincipal()).userId());
        }
        return "anonymous";
    }

    private void sendErrorResponse(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setStatus(429);
        String reqId = org.slf4j.MDC.get("requestId");
        if (reqId == null) reqId = "unknown";

        ErrorResponse error = new ErrorResponse(
                429,
                "TOO_MANY_REQUESTS",
                "Rate limit exceeded",
                request.getRequestURI(),
                reqId
        );

        objectMapper.writeValue(response.getOutputStream(), error);
    }
}
