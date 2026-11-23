package edu.kit.cbc.common.corc.diagramexport;

import jakarta.inject.Singleton;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

/**
 * This class is responsible for generating output files based on a given format and a diagram.
 */
@Singleton
public class DiagramExporter {
    public byte[] export(String exportType, String structureJson) throws IOException, InterruptedException {
        Path tempDir = Files.createTempDirectory("cbc_export_");

        try {
            Path inputJson = tempDir.resolve("input.json");
            Files.writeString(inputJson, structureJson, StandardCharsets.UTF_8);

            // Create temporary output directory
            Path drawioOutDir = tempDir.resolve("out");
            Files.createDirectories(drawioOutDir);

            List<String> command = List.of(
                    "python3",
                    "/app/tools/cbc-diagram-to-draw.io/main.py",
                    inputJson.toAbsolutePath().toString(),
                    "--drawio",
                    drawioOutDir.toAbsolutePath().toString()
            );

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(tempDir.toFile());
            pb.redirectErrorStream(true);

            Process process = pb.start();
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException("Python script error (Exit-Code " + exitCode + "): " + output);
            }

            // Search for generated drawio file
            Path generatedDrawioFile;
            try (var files = Files.list(drawioOutDir)) {
                generatedDrawioFile = files
                        .filter(p -> p.toString().endsWith(".drawio"))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("No .drawio file generated. Output: " + output));
            }

            if ("drawio".equals(exportType)) {
                return Files.readAllBytes(generatedDrawioFile);
            }
            if (!List.of("pdf", "png").contains(exportType)) {
                throw new IllegalArgumentException("File format not supported");
            }

            String drawioXml = Files.readString(generatedDrawioFile, StandardCharsets.UTF_8);
            return convertDrawioViaServer(drawioXml, exportType);

        } finally {
            deleteDirectory(tempDir);
        }
    }

    private void deleteDirectory(Path dir) {
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
        } catch (IOException ignored) {
        }
    }

    private byte[] convertDrawioViaServer(String drawioXml, String format) throws IOException, InterruptedException {
        // Form-Body für jgraph/export-server aufbauen (format=pdf|svg|png & xml=...)
        String formBody = "format=" + URLEncoder.encode(format, StandardCharsets.UTF_8)
                + "&bg=none"
                + "&xml=" + URLEncoder.encode(drawioXml, StandardCharsets.UTF_8);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://drawio-renderer:8000/"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(formBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());

        if (response.statusCode() != 200) {
            String errorBody = new String(response.body(), StandardCharsets.UTF_8);
            throw new RuntimeException("drawio-rendering error (" + response.statusCode() + "): " + errorBody);
        }

        return response.body();
    }
}