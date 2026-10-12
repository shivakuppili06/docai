package com.docai.backend.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();

            MDC.put("operation", request.getMethod() + " " + request.getRequestURI());
            MDC.put("durationMs", String.valueOf(duration));
            MDC.put("status", String.valueOf(status));

            if (status >= 400) {
                MDC.put("errorType", "HTTP_" + status);
                logger.error("Request failed");
            } else {
                logger.info("Request completed");
            }

            MDC.remove("operation");
            MDC.remove("durationMs");
            MDC.remove("status");
            MDC.remove("errorType");
        }
    }
}
