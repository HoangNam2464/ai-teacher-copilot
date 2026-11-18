package com.aiteachercopilot.export;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Result container for exported document binary data, filename, and MIME type.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportResult {

    private byte[] data;
    private String fileName;
    private String contentType;
}
