package edu.kit.cbc.common.corc;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Collections;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

public class FileUtil implements IFileUtil {

    String applicationUri;

    public FileUtil(String applicationUri) {
        this.applicationUri = applicationUri;
    }

    public static void zipDirectory(File folder, String parentFolder, ZipOutputStream zos)
            throws FileNotFoundException, IOException {

        Files.walkFileTree(folder.toPath(), new SimpleFileVisitor<Path>() {
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {

                String pathNewEntry = folder.toPath().relativize(file).toString();
                if (pathNewEntry.startsWith(".meta")) {
                    return FileVisitResult.CONTINUE;
                }
                zos.putNextEntry(new ZipEntry(pathNewEntry));
                Files.copy(file, zos);
                zos.closeEntry();
                return FileVisitResult.CONTINUE;
            }
        });
        zos.close();
    }

    public static void unzipDirectory(File zip, Path target) throws FileNotFoundException, IOException {
        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zip))) {

            // list files in zip
            ZipEntry zipEntry = zis.getNextEntry();

            while (zipEntry != null) {

                if (zipEntry.toString().startsWith(".meta")) {
                    zipEntry = zis.getNextEntry();
                    continue;
                }

                boolean isDirectory = false;
                // some zip stored files and folders separately
                // e.g data/
                // data/folder/
                // data/folder/file.txt
                if (zipEntry.getName().endsWith(File.separator)) {
                    isDirectory = true;
                }

                Path newPath = zipSlipProtect(zipEntry, target);

                if (isDirectory) {
                    Files.createDirectories(newPath);
                } else {
                    // some zip stored file path only, need create parent directories
                    // e.g data/folder/file.txt
                    if (newPath.getParent() != null) {
                        if (Files.notExists(newPath.getParent())) {
                            Files.createDirectories(newPath.getParent());
                        }
                    }

                    // copy files, nio
                    Files.copy(zis, newPath, StandardCopyOption.REPLACE_EXISTING);
                }
                zipEntry = zis.getNextEntry();
            }
            zis.closeEntry();
        }
    }

    private static Path zipSlipProtect(ZipEntry zipEntry, Path targetDir) throws IOException {
        Path targetDirResolved = targetDir.resolve(zipEntry.getName());

        // make sure normalized file still has targetDir as its prefix
        // else throws exception
        Path normalizePath = targetDirResolved.normalize();
        if (!normalizePath.startsWith(targetDir)) {
            throw new IOException("Bad zip entry: " + zipEntry.getName());
        }

        return normalizePath;
    }

    public static String getProjectLocation(URI uri) {
        Path path = Paths.get(uri);
        return path.toString().replace("\\", "/");
    }

    public String getProjectLocation(String uriString) {
        return getProjectLocation(URI.create(uriString));
    }

    public List<String> readFileInList(String path) {
        List<String> lines = Collections.emptyList();
        try {
            lines = Files.readAllLines(Paths.get(path), StandardCharsets.UTF_8);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return lines;
    }

    public File writeFile(String problem, String location, int numberFile, boolean override) {
        File keyFile = new File(location + "/prove" + numberFile + ".key");
        File keyHelperFile = new File(location + "/helper.key");
        // Since no helper file can be created right now, a helper file is provided in
        // the path of keyHelperFileSample
        File keyHelperFileSample = new File(Paths.get(location).getParent() + "/helper.key");
        if (!keyFile.exists() || override) {
            if (!keyHelperFile.exists()) {
                try {
                    keyHelperFile.getParentFile().mkdirs();
                    if (keyHelperFileSample.exists()) {
                        Files.copy(keyHelperFileSample.toPath(), keyHelperFile.toPath(),
                                StandardCopyOption.REPLACE_EXISTING);
                    } else {
                        keyHelperFile.createNewFile();
                    }
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            return createFile(keyFile, problem);
        }
        return null;
    }

    private File createFile(File file, String content) {
        try {
            file.getParentFile().mkdirs();
            file.createNewFile();
            FileWriter fw = new FileWriter(file);
            BufferedWriter bw = new BufferedWriter(fw);

            bw.write(content);
            bw.close();

            return file;
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public String generateComposedClass(String project, String composedClassName, String className, String content,
            String contentOriginal) {
        File generatedClass = new File(getProjectLocation(project) + "/src_gen/" + composedClassName + ".java");
        File originalClass = new File(getProjectLocation(project) + "/src-orig/" + className + ".java");
        if (!className.contentEquals(composedClassName)) {
            createFile(originalClass, contentOriginal);
        }
        File generatedFile = createFile(generatedClass, content);
        return generatedFile.getName().substring(0, generatedFile.getName().indexOf("."));
    }

    private String getLastSegment(String uri) {
        Path path = Paths.get(uri);
        path.subpath(path.getNameCount() - 2, path.getNameCount());
        return path.toString();
    }

    public String getLocationString(String uri) {
        return getProjectLocation(uri) + "/prove_" + getLastSegment(uri);
    }

    @Override
    public File getClassFile(String className) {
        throw new UnsupportedOperationException("Unimplemented method 'getClassFile'");
    }
}
