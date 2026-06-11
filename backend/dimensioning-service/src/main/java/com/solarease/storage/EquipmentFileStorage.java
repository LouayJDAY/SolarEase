package com.solarease.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;

@Service
public class EquipmentFileStorage {

    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final long MAX_BYTES = 5L * 1024 * 1024;

    @Value("${solarease.upload.dir:uploads}")
    private String uploadDir;

    public String savePhoto(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier image requis");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Image trop lourde (max 5 Mo)");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED.contains(contentType)) {
            throw new IllegalArgumentException("Format non supporté (JPG, PNG, WEBP)");
        }

        String ext = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };

        Path dir = Path.of(uploadDir, "equipment");
        Files.createDirectories(dir);
        String fileName = UUID.randomUUID() + ext;
        Path target = dir.resolve(fileName);
        Files.copy(file.getInputStream(), target);
        return "/api/equipment/files/" + fileName;
    }

    public Path resolve(String fileName) {
        if (fileName == null || fileName.contains("..") || fileName.contains("/")) {
            throw new IllegalArgumentException("Nom de fichier invalide");
        }
        Path path = Path.of(uploadDir, "equipment", fileName).normalize();
        if (!Files.exists(path)) {
            throw new IllegalArgumentException("Fichier introuvable");
        }
        return path;
    }
}
