package edu.kit.cbc.common.corc.parsing;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseProblemException;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.utils.Pair;
import edu.kit.cbc.projects.files.controller.FilesController;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public final class JavaFileChecker {
    private final String projectId;
    private final FilesController filesController;

    public JavaFileChecker(Optional<String> projectId, FilesController filesController) {
        this.projectId = projectId.orElse("");
        this.filesController = filesController;
    }

    public Map<String, List<String>> checkFiles() throws SemanticException {
        List<Path> paths;
        Map<String, List<String>> availableClassMethods = new HashMap<>();

        try {
            paths = filesController.retrieveFiles(projectId, ".java", "");
        } catch (IOException e) {
            throw new SemanticException("could not load all java files of project");
        }

        for (Path path : paths) {
            File file = path.toFile();
            Optional<List<Pair<String, List<String>>>> classesAndMethods = getClassAndMethod(file);
            if (classesAndMethods.isPresent()) {
                classesAndMethods.get().forEach(pair ->
                        availableClassMethods.put(pair.a, pair.b)
                );
            } else {
                throw new SemanticException(file.getName() + " is not valid");
            }
        }

        return availableClassMethods;
    }

    private static Optional<List<Pair<String, List<String>>>> getClassAndMethod(File file) {
        try {
            ParserConfiguration configuration = new ParserConfiguration();
            configuration.setLanguageLevel(ParserConfiguration.LanguageLevel.JAVA_17);
            JavaParser javaParser = new JavaParser(configuration);
            Optional<com.github.javaparser.ast.CompilationUnit> compilationUnit = javaParser.parse(file).getResult();
            return compilationUnit.map(unit -> unit.findAll(ClassOrInterfaceDeclaration.class)
                    .stream()
                    .filter(foundClass -> !foundClass.isInterface())
                    .map(foundClass -> new Pair<>(
                            foundClass.getNameAsString(),
                            foundClass.getMethods().stream().map(MethodDeclaration::getNameAsString).toList()

                    )).toList());
        } catch (ParseProblemException | FileNotFoundException e) {
            // The file contains syntax errors or could not be found
            return Optional.empty();
        }
    }
}
