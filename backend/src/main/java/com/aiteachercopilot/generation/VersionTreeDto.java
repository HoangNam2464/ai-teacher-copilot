package com.aiteachercopilot.generation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO representing the complete version lineage and hierarchical tree
 * of a generated teaching material [BE-028].
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VersionTreeDto {

    /**
     * UUID of the root version (v1) in the lineage tree.
     */
    private UUID rootId;

    /**
     * UUID of the version node currently selected or queried.
     */
    private UUID currentId;

    /**
     * Version number of the queried item (e.g. 1, 2, 3).
     */
    private Integer currentVersion;

    /**
     * Highest version number available in this lineage tree.
     */
    private Integer latestVersion;

    /**
     * Total number of versions available in this lineage tree.
     */
    private Integer totalVersions;

    /**
     * Ordered list of all versions from root (v1) to latest (vN), sorted ascending by version.
     */
    private List<GenerationResponseDto> versions;
}
