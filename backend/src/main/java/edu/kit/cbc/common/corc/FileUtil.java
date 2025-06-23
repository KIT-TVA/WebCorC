package edu.kit.cbc.common.corc;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public final class FileUtil {

    private FileUtil() {

    }

    public static void deleteDirectory(Path directory) throws IOException {
        Files.list(directory).forEach(elem -> {
            try {
                if (Files.isDirectory(elem)) {
                    deleteDirectory(elem);

                } else {
                    Files.delete(elem);
                }
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        Files.delete(directory);
    }
}
