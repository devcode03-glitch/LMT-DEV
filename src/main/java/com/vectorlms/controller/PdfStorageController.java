package com.vectorlms.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pdfs")
public class PdfStorageController {

    private static final long SIGNED_URL_TTL_MS = 60L * 60L * 1000L; // 60 minutes
    private static final String SIGNING_SECRET = System.getenv("PDF_SIGNING_SECRET") != null
        ? System.getenv("PDF_SIGNING_SECRET")
        : "vectorlms-cloud-signed-url-secret-v1";

    private final Path storageRoot = Paths.get("storage").toAbsolutePath().normalize();
    private final Path localDiskDir = storageRoot.resolve("local-disk");
    private final Path cloudBucketDir = storageRoot.resolve("cloud-bucket");
    private final Path indexFile = storageRoot.resolve("pdf-index.json");
    private final ObjectMapper objectMapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
    private final SecureRandom random = new SecureRandom();

    public static class StoredPdfMetadata {
        public String id;
        public String name;
        public String safeFileName;
        public long sizeBytes;
        public int pageCount;
        public String storageDestination;
        public String batchId;
        public String lectureId;
        public String uploadedBy;
        public String uploadedAt;
        public String localDiskPath;
        public String cloudBucketPath;
        public String storedFilePath;
    }

    public static class UploadPdfRequest {
        public String name;
        public Long sizeBytes;
        public Integer pageCount;
        public String destination;
        public String batchId;
        public String lectureId;
        public String uploadedBy;
        public String base64Data;
    }

    public static class MigratePdfRequest {
        public String destination;
    }

    private void ensureStorageDirs() throws IOException {
        Files.createDirectories(localDiskDir);
        Files.createDirectories(cloudBucketDir);
    }

    private synchronized List<StoredPdfMetadata> readIndex() throws IOException {
        ensureStorageDirs();
        if (!Files.exists(indexFile)) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(indexFile.toFile(), new TypeReference<List<StoredPdfMetadata>>() {});
        } catch (Exception ex) {
            return new ArrayList<>();
        }
    }

    private synchronized void writeIndex(List<StoredPdfMetadata> records) throws IOException {
        ensureStorageDirs();
        objectMapper.writeValue(indexFile.toFile(), records);
    }

    private String sanitizeFileName(String name) {
        String base = Paths.get(name == null || name.isBlank() ? "document.pdf" : name).getFileName().toString();
        String cleaned = base.replaceAll("[^a-zA-Z0-9._-]", "_");
        return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : cleaned + ".pdf";
    }

    private String createSignedToken(String id, long expiresAt) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(SIGNING_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal((id + ":" + expiresAt).getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.substring(0, 32);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to sign URL", ex);
        }
    }

    private Map<String, Object> serializeRecord(StoredPdfMetadata rec) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", rec.id);
        map.put("name", rec.name);
        map.put("sizeBytes", rec.sizeBytes);
        map.put("pageCount", rec.pageCount);
        map.put("storageDestination", rec.storageDestination);
        map.put("batchId", rec.batchId);
        if (rec.lectureId != null) {
            map.put("lectureId", rec.lectureId);
        }
        map.put("uploadedBy", rec.uploadedBy);
        map.put("uploadedAt", rec.uploadedAt);

        if ("cloud".equals(rec.storageDestination)) {
            long expiresAt = System.currentTimeMillis() + SIGNED_URL_TTL_MS;
            String token = createSignedToken(rec.id, expiresAt);
            map.put("cloudBucketPath", rec.cloudBucketPath);
            map.put("signedUrl", "/api/pdfs/signed/" + rec.id + "?token=" + token + "&expires=" + expiresAt);
            map.put("signedUrlExpiresAt", expiresAt);
        } else {
            map.put("localDiskPath", rec.localDiskPath);
        }
        map.put("savedOnServer", true);
        return map;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listPdfs() throws IOException {
        List<StoredPdfMetadata> records = readIndex();
        List<Map<String, Object>> serialized = new ArrayList<>();
        for (StoredPdfMetadata rec : records) {
            if (rec.storedFilePath != null && Files.exists(Paths.get(rec.storedFilePath))) {
                serialized.add(serializeRecord(rec));
            }
        }
        return ResponseEntity.ok(Map.of("pdfs", serialized));
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadPdf(@RequestBody UploadPdfRequest req) {
        try {
            if (req.name == null || req.base64Data == null ||
                (!"disk".equals(req.destination) && !"cloud".equals(req.destination))) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing required PDF upload fields or invalid storage destination."));
            }

            byte[] bytes = Base64.getDecoder().decode(req.base64Data);
            if (bytes.length == 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Uploaded PDF data is empty."));
            }

            ensureStorageDirs();
            byte[] rnd = new byte[3];
            random.nextBytes(rnd);
            StringBuilder suffix = new StringBuilder();
            for (byte b : rnd) {
                suffix.append(String.format("%02x", b));
            }
            String id = "pdf-" + System.currentTimeMillis() + "-" + suffix;
            String safeFileName = sanitizeFileName(req.name);
            String batchId = (req.batchId == null || req.batchId.isBlank()) ? "general" : req.batchId;
            String safeBatch = batchId.replaceAll("[^a-zA-Z0-9_-]", "_");

            Path storedPath;
            String localDiskPath = null;
            String cloudBucketPath = null;

            if ("disk".equals(req.destination)) {
                storedPath = localDiskDir.resolve(id + "_" + safeFileName);
                localDiskPath = "./storage/local-disk/" + id + "_" + safeFileName;
            } else {
                Path batchBucketDir = cloudBucketDir.resolve(safeBatch);
                Files.createDirectories(batchBucketDir);
                storedPath = batchBucketDir.resolve(id + "_" + safeFileName);
                cloudBucketPath = "cloud://vectorlms-pdfs/" + safeBatch + "/" + id + "_" + safeFileName;
            }

            Files.write(storedPath, bytes);

            StoredPdfMetadata rec = new StoredPdfMetadata();
            rec.id = id;
            rec.name = req.name;
            rec.safeFileName = safeFileName;
            rec.sizeBytes = req.sizeBytes != null && req.sizeBytes > 0 ? req.sizeBytes : bytes.length;
            rec.pageCount = req.pageCount != null && req.pageCount > 0 ? req.pageCount : 1;
            rec.storageDestination = req.destination;
            rec.batchId = batchId;
            rec.lectureId = req.lectureId;
            rec.uploadedBy = (req.uploadedBy == null || req.uploadedBy.isBlank()) ? "Instructor" : req.uploadedBy;
            rec.uploadedAt = Instant.now().toString();
            rec.localDiskPath = localDiskPath;
            rec.cloudBucketPath = cloudBucketPath;
            rec.storedFilePath = storedPath.toString();

            List<StoredPdfMetadata> existing = readIndex();
            existing.add(0, rec);
            writeIndex(existing);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("pdf", serializeRecord(rec)));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to persist PDF file."));
        }
    }

    @GetMapping("/file/{id}")
    public ResponseEntity<Resource> getDiskPdf(@PathVariable("id") String id) throws IOException {
        StoredPdfMetadata rec = readIndex().stream()
            .filter(r -> Objects.equals(r.id, id))
            .findFirst()
            .orElse(null);

        if (rec == null || rec.storedFilePath == null) {
            return ResponseEntity.notFound().build();
        }
        Path filePath = Paths.get(rec.storedFilePath);
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + rec.safeFileName + "\"")
            .body(new FileSystemResource(filePath));
    }

    @GetMapping("/signed/{id}")
    public ResponseEntity<?> getSignedCloudPdf(
        @PathVariable("id") String id,
        @RequestParam(name = "token", defaultValue = "") String token,
        @RequestParam(name = "expires", defaultValue = "0") long expires
    ) throws IOException {
        if (token.isBlank() || expires <= 0 || System.currentTimeMillis() > expires) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Signed URL has expired or is invalid."));
        }
        if (!Objects.equals(token, createSignedToken(id, expires))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Invalid signed URL signature."));
        }

        StoredPdfMetadata rec = readIndex().stream()
            .filter(r -> Objects.equals(r.id, id))
            .findFirst()
            .orElse(null);

        if (rec == null || rec.storedFilePath == null) {
            return ResponseEntity.notFound().build();
        }
        Path filePath = Paths.get(rec.storedFilePath);
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + rec.safeFileName + "\"")
            .cacheControl(CacheControl.noCache().cachePrivate())
            .body(new FileSystemResource(filePath));
    }

    @PostMapping("/{id}/migrate")
    public ResponseEntity<Map<String, Object>> migratePdf(
        @PathVariable("id") String id,
        @RequestBody MigratePdfRequest req
    ) {
        try {
            if (!"disk".equals(req.destination) && !"cloud".equals(req.destination)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid target destination."));
            }

            List<StoredPdfMetadata> records = readIndex();
            StoredPdfMetadata rec = records.stream()
                .filter(r -> Objects.equals(r.id, id))
                .findFirst()
                .orElse(null);

            if (rec == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "PDF record not found."));
            }
            Path sourcePath = Paths.get(rec.storedFilePath);
            if (!Files.exists(sourcePath)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Source PDF file missing."));
            }
            if (Objects.equals(rec.storageDestination, req.destination)) {
                return ResponseEntity.ok(Map.of("pdf", serializeRecord(rec)));
            }

            String safeBatch = (rec.batchId == null ? "general" : rec.batchId).replaceAll("[^a-zA-Z0-9_-]", "_");
            Path targetPath;
            if ("disk".equals(req.destination)) {
                targetPath = localDiskDir.resolve(rec.id + "_" + rec.safeFileName);
                rec.localDiskPath = "./storage/local-disk/" + rec.id + "_" + rec.safeFileName;
                rec.cloudBucketPath = null;
            } else {
                Path batchBucketDir = cloudBucketDir.resolve(safeBatch);
                Files.createDirectories(batchBucketDir);
                targetPath = batchBucketDir.resolve(rec.id + "_" + rec.safeFileName);
                rec.cloudBucketPath = "cloud://vectorlms-pdfs/" + safeBatch + "/" + rec.id + "_" + rec.safeFileName;
                rec.localDiskPath = null;
            }

            Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
            if (!sourcePath.equals(targetPath)) {
                Files.deleteIfExists(sourcePath);
            }

            rec.storageDestination = req.destination;
            rec.storedFilePath = targetPath.toString();
            writeIndex(records);

            return ResponseEntity.ok(Map.of("pdf", serializeRecord(rec)));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to move PDF storage location."));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePdf(@PathVariable("id") String id) throws IOException {
        List<StoredPdfMetadata> records = readIndex();
        List<StoredPdfMetadata> remaining = new ArrayList<>();
        for (StoredPdfMetadata rec : records) {
            if (Objects.equals(rec.id, id)) {
                if (rec.storedFilePath != null) {
                    Files.deleteIfExists(Paths.get(rec.storedFilePath));
                }
            } else {
                remaining.add(rec);
            }
        }
        writeIndex(remaining);
        return ResponseEntity.ok(Map.of("deleted", true, "id", id));
    }
}
