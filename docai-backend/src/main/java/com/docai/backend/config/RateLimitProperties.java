package com.docai.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.ratelimit")
public class RateLimitProperties {

    private long authLimit = 5;
    private long authWindow = 60; // seconds

    private long uploadLimit = 10;
    private long uploadWindow = 60; // seconds

    private long chatLimit = 20;
    private long chatWindow = 60; // seconds

    private long apiLimit = 100;
    private long apiWindow = 60; // seconds

    public long getAuthLimit() { return authLimit; }
    public void setAuthLimit(long authLimit) { this.authLimit = authLimit; }

    public long getAuthWindow() { return authWindow; }
    public void setAuthWindow(long authWindow) { this.authWindow = authWindow; }

    public long getUploadLimit() { return uploadLimit; }
    public void setUploadLimit(long uploadLimit) { this.uploadLimit = uploadLimit; }

    public long getUploadWindow() { return uploadWindow; }
    public void setUploadWindow(long uploadWindow) { this.uploadWindow = uploadWindow; }

    public long getChatLimit() { return chatLimit; }
    public void setChatLimit(long chatLimit) { this.chatLimit = chatLimit; }

    public long getChatWindow() { return chatWindow; }
    public void setChatWindow(long chatWindow) { this.chatWindow = chatWindow; }

    public long getApiLimit() { return apiLimit; }
    public void setApiLimit(long apiLimit) { this.apiLimit = apiLimit; }

    public long getApiWindow() { return apiWindow; }
    public void setApiWindow(long apiWindow) { this.apiWindow = apiWindow; }
}
