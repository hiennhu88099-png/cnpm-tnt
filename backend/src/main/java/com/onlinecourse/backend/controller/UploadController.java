package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.exception.FieldValidationException;
import com.onlinecourse.backend.exception.ResourceNotFoundException;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@RestController
public class UploadController {

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5 MB
    private static final Pattern SAFE_FILENAME = Pattern.compile("^[a-zA-Z0-9_-]+\\.(jpg|png|webp|gif)$");
    private static final Map<String, String> CONTENT_TYPE_EXT = Map.of(
            "image/jpeg", ".jpg",
            "image/jpg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    private final Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();

    @PostMapping("/api/uploads")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FieldValidationException("avatar", "Vui lòng chọn file ảnh để tải lên");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FieldValidationException("avatar", "Kích thước ảnh không được vượt quá 5MB");
        }

        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        String ext = CONTENT_TYPE_EXT.get(contentType);
        if (ext == null) {
            throw new FieldValidationException("avatar", "Chỉ hỗ trợ ảnh định dạng JPG, PNG, WEBP hoặc GIF");
        }

        String filename = UUID.randomUUID().toString().replace("-", "") + ext;
        try {
            Files.createDirectories(uploadDir);
            Path target = uploadDir.resolve(filename).normalize();
            if (!target.startsWith(uploadDir)) {
                throw new FieldValidationException("avatar", "Tên file không hợp lệ");
            }
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new FieldValidationException("avatar", "Không thể lưu file ảnh tải lên");
        }

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/courses/uploads/")
                .path(filename)
                .toUriString();

        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/api/courses/uploads/{filename:.+}")
    public ResponseEntity<Resource> serveImage(@PathVariable String filename) {
        if (filename == null || !SAFE_FILENAME.matcher(filename).matches()) {
            throw new ResourceNotFoundException("Không tìm thấy ảnh");
        }

        Path target = uploadDir.resolve(filename).normalize();
        if (!target.startsWith(uploadDir) || !Files.exists(target)) {
            throw new ResourceNotFoundException("Không tìm thấy ảnh");
        }

        try {
            Resource resource = new UrlResource(target.toUri());
            MediaType mediaType = resolveMediaType(filename);
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Không tìm thấy ảnh");
        }
    }

    private MediaType resolveMediaType(String filename) {
        if (filename.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (filename.endsWith(".gif")) {
            return MediaType.IMAGE_GIF;
        }
        if (filename.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        return MediaType.IMAGE_JPEG;
    }
}
