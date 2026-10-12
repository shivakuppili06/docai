package com.docai.backend.config;

import com.docai.backend.filter.DocumentIdInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final DocumentIdInterceptor documentIdInterceptor;
    private final com.docai.backend.interceptor.RateLimitInterceptor rateLimitInterceptor;

    public WebMvcConfig(DocumentIdInterceptor documentIdInterceptor, com.docai.backend.interceptor.RateLimitInterceptor rateLimitInterceptor) {
        this.documentIdInterceptor = documentIdInterceptor;
        this.rateLimitInterceptor = rateLimitInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor).addPathPatterns("/api/**");
        registry.addInterceptor(documentIdInterceptor).addPathPatterns("/api/**");
    }
}
