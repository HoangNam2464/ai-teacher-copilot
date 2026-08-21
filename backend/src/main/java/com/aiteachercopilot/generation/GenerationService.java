package com.aiteachercopilot.generation;

import com.aiteachercopilot.workspace.WorkspaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerationService {

    private final WorkspaceService workspaceService;
    private final WebClient aiServiceWebClient;

    public Object generateLessonPlan(UUID workspaceId, UUID userId, GenerationRequestDto req) {
        workspaceService.findAndAuthorize(workspaceId, userId);

        return aiServiceWebClient.post()
                .uri(builder -> builder.path("/generation/lesson-plan")
                        .queryParam("workspace_id", workspaceId)
                        .queryParam("subject", req.getSubject())
                        .queryParam("grade_level", req.getGradeLevel())
                        .queryParam("topic", req.getTopic())
                        .queryParam("instructions", req.getInstructions())
                        .build())
                .retrieve()
                .bodyToMono(Object.class)
                .block();
    }

    public Object generateQuiz(UUID workspaceId, UUID userId, GenerationRequestDto req) {
        workspaceService.findAndAuthorize(workspaceId, userId);

        return aiServiceWebClient.post()
                .uri(builder -> builder.path("/generation/quiz")
                        .queryParam("workspace_id", workspaceId)
                        .queryParam("subject", req.getSubject())
                        .queryParam("grade_level", req.getGradeLevel())
                        .queryParam("topic", req.getTopic())
                        .queryParam("instructions", req.getInstructions())
                        .queryParam("num_questions", req.getNumQuestions())
                        .build())
                .retrieve()
                .bodyToMono(Object.class)
                .block();
    }
}
