package edu.kit.cbc.common.corc.parsing;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseProblemException;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.StaticJavaParser;
import edu.kit.cbc.projects.files.controller.FilesController;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

public class JavaFileCheckerUtil {
    public static void checkFiles(String projectId, FilesController filesController) throws SemanticException {
        try {
            List<Path> paths = filesController.retrieveFiles(projectId, ".java", "");
            for (Path path : paths) {
                File file = path.toFile();
                if (!isValid(file)) {
                    throw new SemanticException(file.getName() + " is not valid");
                }
            }
        } catch (IOException e) {
            throw new SemanticException("could not load all java files of project");
        }
    }

    public static boolean isValid(File file) {
        try {
            ParserConfiguration configuration = new ParserConfiguration();
            configuration.setLanguageLevel(ParserConfiguration.LanguageLevel.JAVA_17);
            JavaParser javaParser = new JavaParser(configuration);
            var whatever = javaParser.parse(file);
            return whatever.getProblems().isEmpty();
        } catch (ParseProblemException | FileNotFoundException e) {
            // The file contains syntax errors or could not be found
            return false;
        }
    }
}
