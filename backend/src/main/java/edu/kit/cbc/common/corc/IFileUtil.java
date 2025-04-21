package edu.kit.cbc.common.corc;

import java.io.File;
import java.util.List;

public interface IFileUtil {

    File getClassFile(String className);

    List<String> readFileInList(String path);

    File writeFile(String problem, String location, int numberFile, boolean override);

    String getProjectLocation(String uri);

    String generateComposedClass(String project, String composedClassName, String className, String content, String contentOriginal);

    String getLocationString(String uri);
}
