package de.tu_bs.cs.isf.cbc.web.java.compilation;

import java.util.ArrayList;
import java.util.List;

import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileManager;
import javax.tools.JavaFileObject;
import javax.tools.ToolProvider;

public class WebCorcCompileJava {

	public static void main(String[] args) {
		WebCorcCompileJava javaCompiler = new WebCorcCompileJava();
		System.out.println(javaCompiler
				.compileJavaString("class Hi {public void main(String[] args){System.out.println(\"hallo\");}}"));
	}
	
	public String compileJavaString(String src) {
		return compileJavaString(src, null);
	}

	public String compileJavaString(String src, String fileName) {
		if(fileName == null) {
			// TODO standard value assignen
		}
		
		// Full name of the class that will be compiled.
		// If class should be in some package,
		// fullName should contain it too
		// (ex. "testpackage.DynaClass")
		// TODO: extract fully qualified name from src
		// Example: "de.tu_bs.cs.isf.cbc.Beispiel"
		String className = "temp";
//		try {
//			className = getClassName(src);
//		} catch (Exception e) {
//			return "Error: " + e.getMessage();
//		}

		// We get an instance of JavaCompiler. Then
		// we create a file manager
		// (our custom implementation of it)
		JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
		JavaFileManager fileManager = new ClassFileManager(compiler.getStandardFileManager(null, null, null));

		// Dynamic compiling requires specifying
		// a list of "files" to compile. In our case
		// this is a list containing one "file" which is in our case
		// our own implementation (see details below)
		List<JavaFileObject> jfiles = new ArrayList<JavaFileObject>();
		jfiles.add(new CharSequenceJavaFileObject(className, src));

		// We specify a task to the compiler. Compiler should use our file
		// manager and our list of "files".
		// Then we run the compilation with call()
		DiagnosticCollector<JavaFileObject> diagnosticsCollector = new DiagnosticCollector<JavaFileObject>();
		JavaCompiler.CompilationTask task = compiler.getTask(null, fileManager, diagnosticsCollector, null, null,
				jfiles);
		boolean success = task.call();
		String errorMessage = "";
		int errorCount = 0;
		if (!success) {
			List<Diagnostic<? extends JavaFileObject>> diagnostics = diagnosticsCollector.getDiagnostics();
			for (Diagnostic<? extends JavaFileObject> diagnostic : diagnostics) {
				// read error details from the diagnostic object
//				System.out.println("/"+className+".java:"+diagnostic.getLineNumber() + ": error:" + diagnostic.getMessage(null));
				errorMessage = errorMessage.concat(diagnostic.toString()+"\n");
				errorCount ++;
			}
			
			String error = "error";
			if (errorCount > 1) error = "errors";
			errorMessage = errorMessage.concat("\n" +errorCount +" "+ error);
			return errorMessage;
		} else {
			return "Compilation successful";
		}

		// Creating an instance of our compiled class and
		// running its toString() method
//		Object instance;
//		try {
//			instance = fileManager.getClassLoader(null).loadClass(className).newInstance();
//			System.out.println(instance);
//		} catch (InstantiationException e) {
//			e.printStackTrace();
//		} catch (IllegalAccessException e) {
//			e.printStackTrace();
//		} catch (ClassNotFoundException e) {
//			e.printStackTrace();
//		} catch (Exception e) {
//			e.printStackTrace();
//		}
	}

	private String getClassName(String code) {
		String[] codeLines = code.split("\n");
		String[] codeWords;

		for (String line : codeLines) {
			if (line.contains("class")) {
				codeWords = line.split(" ");
				for (int i = 0; i < codeWords.length; i++) {
					if (codeWords[i].equals("class")) {
						return codeWords[i + 1];
					}
				}
			}
		}
		throw new RuntimeException("Could not find class name!");
	}
}
