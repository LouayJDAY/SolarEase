package com.solarease.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private static final Set<String> MESSAGE_ATTACHMENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/zip",
            "application/x-zip-compressed"
    );

    @Value("${solarease.upload.dir:/app/uploads}")
    private String uploadDir;

    @Value("${solarease.upload.max-photo-bytes:5242880}")
    private long maxPhotoBytes;

    @Value("${solarease.upload.max-message-attachment-bytes:10485760}")
    private long maxMessageAttachmentBytes;

    public StoredFile saveFieldPhoto(Long projectId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Photo file is required");
        }
        if (file.getSize() > maxPhotoBytes) {
            throw new IllegalArgumentException("Photo exceeds maximum size of " + (maxPhotoBytes / 1024 / 1024) + " MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported image type. Allowed: JPEG, PNG, WebP");
        }

        String extension = extensionForContentType(contentType);
        String fileName = UUID.randomUUID() + extension;
        Path projectDir = Path.of(uploadDir, "field-photos", String.valueOf(projectId));

        try {
            Files.createDirectories(projectDir);
            Path target = projectDir.resolve(fileName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.info("Saved field photo for project {} at {}", projectId, target);

            String publicPath = "/api/files/field-photos/" + projectId + "/" + fileName;
            return new StoredFile(fileName, publicPath, contentType);
        } catch (IOException e) {
            log.error("Failed to save field photo for project {}", projectId, e);
            throw new IllegalStateException("Could not store photo", e);
        }
    }

    public Path resolveFieldPhotoPath(Long projectId, String fileName) {
        if (fileName == null || fileName.isBlank() || fileName.contains("..") || fileName.contains("/")) {
            throw new IllegalArgumentException("Invalid file name");
        }
        Path path = Path.of(uploadDir, "field-photos", String.valueOf(projectId), fileName);
        if (!Files.isRegularFile(path)) {
            throw new IllegalArgumentException("Photo not found");
        }
        return path;
    }

    public StoredFile saveMessageAttachment(Long projectId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Attachment file is required");
        }
        if (file.getSize() > maxMessageAttachmentBytes) {
            throw new IllegalArgumentException(
                    "Attachment exceeds maximum size of " + (maxMessageAttachmentBytes / 1024 / 1024) + " MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !MESSAGE_ATTACHMENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Unsupported file type. Allowed: PDF, images, Word, Excel, TXT, ZIP");
        }

        String extension = extensionForAttachment(contentType, file.getOriginalFilename());
        String fileName = UUID.randomUUID() + extension;
        Path projectDir = Path.of(uploadDir, "message-attachments", String.valueOf(projectId));

        try {
            Files.createDirectories(projectDir);
            Path target = projectDir.resolve(fileName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.info("Saved message attachment for project {} at {}", projectId, target);

            String publicPath = "/api/files/message-attachments/" + projectId + "/" + fileName;
            return new StoredFile(fileName, publicPath, contentType);
        } catch (IOException e) {
            log.error("Failed to save message attachment for project {}", projectId, e);
            throw new IllegalStateException("Could not store attachment", e);
        }
    }

    public Path resolveMessageAttachmentPath(Long projectId, String fileName) {
        if (fileName == null || fileName.isBlank() || fileName.contains("..") || fileName.contains("/")) {
            throw new IllegalArgumentException("Invalid file name");
        }
        Path path = Path.of(uploadDir, "message-attachments", String.valueOf(projectId), fileName);
        if (!Files.isRegularFile(path)) {
            throw new IllegalArgumentException("Attachment not found");
        }
        return path;
    }

    private String extensionForAttachment(String contentType, String originalFilename) {
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase();
            if (ext.matches("\\.[a-z0-9]{1,8}")) {
                return ext;
            }
        }
        return switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "application/pdf" -> ".pdf";
            case "text/plain" -> ".txt";
            case "application/msword" -> ".doc";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx";
            case "application/vnd.ms-excel" -> ".xls";
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> ".xlsx";
            case "application/zip", "application/x-zip-compressed" -> ".zip";
            default -> ".jpg";
        };
    }

    private String extensionForContentType(String contentType) {
        return switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    public record StoredFile(String fileName, String publicUrl, String contentType) {}
}
