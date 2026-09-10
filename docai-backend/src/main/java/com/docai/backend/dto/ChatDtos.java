package com.docai.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ChatDtos {
    public record AskRequest(
            @NotNull Long documentId,
            @NotBlank String question
    ) {}
}
