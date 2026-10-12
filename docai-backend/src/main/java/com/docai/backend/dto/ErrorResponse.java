package com.docai.backend.dto;

import java.time.Instant;

public class ErrorResponse {
    private String timestamp;
    private int status;
    private String errorCode;
    private String message;
    private String path;
    private String requestId;

    public ErrorResponse(int status, String errorCode, String message, String path, String requestId) {
        this.timestamp = Instant.now().toString();
        this.status = status;
        this.errorCode = errorCode;
        this.message = message;
        this.path = path;
        this.requestId = requestId;
    }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }
    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }
}
