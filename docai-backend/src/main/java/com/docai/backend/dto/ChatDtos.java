package com.docai.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public class ChatDtos {
    public record AskRequest(
            Long documentId,
            List<Long> documentIds,
            @NotBlank @Size(min = 1, max = 2000) String question
    ) {}
}
