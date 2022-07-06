package de.tu_bs.cs.isf.cbc.web.util;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
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

import org.eclipse.emf.common.util.URI;

public class FileUtil implements IFileUtil {

	String applicationUri;

	public FileUtil(String applicationUri) {
		this.applicationUri = applicationUri;
	}

	public File getClassFile(String className) {
		URI uriTrimmed = URI.createURI(applicationUri).trimFragment();
		if (uriTrimmed.isPlatformResource()) {
			/*
			 * String platformString = uriTrimmed.toPlatformString(true); IResource
			 * fileResource =
			 * ResourcesPlugin.getWorkspace().getRoot().findMember(platformString); if
			 * (fileResource != null) { IProject project = fileResource.getProject(); return
			 * traverseFolders(project, className);
			 * 
			 * }
			 */
		}
		return null;
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
				
				if(zipEntry.toString().startsWith(".meta")) {
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

	/*
	 * private File traverseFolders(IContainer folder, String className) { try {
	 * IResource[] members = folder.members(); for (final IResource resource :
	 * members) { if (resource instanceof IContainer) { File foundFile =
	 * traverseFolders((IContainer) resource, className); if (foundFile != null) {
	 * return foundFile; } } else if (resource instanceof IFile) {
	 * 
	 * final IFile file = (IFile) resource; if (file.getName().equals(className +
	 * ".java")) { return file.getLocation().toFile(); } } } } catch (CoreException
	 * e) { e.printStackTrace(); } return null; }
	 */

	public List<String> readFileInList(String path) {
		List<String> lines = Collections.emptyList();
		try {
			lines = Files.readAllLines(Paths.get(path), StandardCharsets.UTF_8);
		} catch (IOException e) {
			e.printStackTrace();
		}
		return lines;
	}

	public String getProjectLocation(String uriString) {
		// return getProjectLocationS(uriString);
		return URI.createURI(uriString).trimSegments(1).toFileString().replace("\\\\", "\\").replace("\\", "/");
	}

	/*
	 * private static String getProjectLocationS(String uriPath) { uriPath =
	 * uriPath.substring(1, uriPath.length()); int positionOfSlash =
	 * uriPath.indexOf('/') + 1; uriPath = uriPath.substring(positionOfSlash,
	 * uriPath.length()); IProject thisProject = null; for (IProject p :
	 * ResourcesPlugin.getWorkspace().getRoot().getProjects()) { if (p.getFile(new
	 * Path(uriPath)).exists()) { thisProject = p; } } // if
	 * (thisProject.getName().contains("Userstudy")) { // File diagramFile = new
	 * File(thisProject.getLocation() + "/" + uriPath); // File diagramFileCopy =
	 * new File(thisProject.getLocation() + "/src/saved/ExDia" + proofCounter +
	 * ".diagram"); // File cbcFile = new File(thisProject.getLocation() + "/" +
	 * uriPath.substring(0, uriPath.indexOf(".")) + ".cbcmodel"); // File
	 * cbcFileCopy = new File(thisProject.getLocation() + "/src/saved/ExDia" +
	 * proofCounter + ".cbcmodel"); // proofCounter++; // try { // IWorkspace
	 * workspace = ResourcesPlugin.getWorkspace(); //
	 * Files.copy(diagramFile.toPath(), diagramFileCopy.toPath(),
	 * StandardCopyOption.REPLACE_EXISTING); // Files.copy(cbcFile.toPath(),
	 * cbcFileCopy.toPath(), StandardCopyOption.REPLACE_EXISTING); // IPath
	 * iLocation = Path.fromOSString(diagramFileCopy.getAbsolutePath()); // IFile
	 * ifile = workspace.getRoot().getFileForLocation(iLocation); //
	 * ifile.refreshLocal(0, null); // iLocation =
	 * Path.fromOSString(cbcFileCopy.getAbsolutePath()); // ifile =
	 * workspace.getRoot().getFileForLocation(iLocation); // ifile.refreshLocal(0,
	 * null); // } catch (IOException | CoreException e) { // e.printStackTrace();
	 * // } // } return null; }
	 */

	public static String getProjectLocation(URI uri) {
		// uri = uri.trimFragment();
		// String uriPath = uri.toPlatformString(true);
		// return getProjectLocationS(uriPath);
		return uri.trimSegments(1).toFileString().replace("\\\\", "\\").replace("\\", "/"); // just return the place of
																							// the save destination of
																							// rResource-file
	}

	/*
	 * public static IProject getProject(URI uri) { uri = uri.trimFragment(); String
	 * uriPath = uri.toPlatformString(true);
	 * 
	 * uriPath = uriPath.substring(1, uriPath.length()); int positionOfSlash =
	 * uriPath.indexOf('/') + 1; uriPath = uriPath.substring(positionOfSlash,
	 * uriPath.length()); IProject thisProject = null; for (IProject p :
	 * ResourcesPlugin.getWorkspace().getRoot().getProjects()) { if (p.getFile(new
	 * Path(uriPath)).exists()) { thisProject = p; } } return thisProject; }
	 */

	public File writeFile(String problem, String location, int numberFile, boolean override) {
		File keyFile = new File(location + "/prove" + numberFile + ".key");
		File keyHelperFile = new File(location + "/helper.key");
		// Since no helper file can be created right now, a helper file is provided in
		// the path of keyHelperFileSample
		File keyHelperFileSample = new File(URI.createURI(location).trimSegments(1).toString() + "/helper.key");
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
		return URI.createURI(uri).trimFileExtension().lastSegment();
	}

	public String getLocationString(String uri) {
		return getProjectLocation(uri) + "/prove_" + getLastSegment(uri);
	}
}
