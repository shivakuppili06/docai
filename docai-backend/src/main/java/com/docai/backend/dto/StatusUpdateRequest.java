package com.docai.backend.dto;

import com.docai.backend.model.Document;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(@NotNull Document.DocumentStatus status) {
}
