package edu.kit.cbc.web.server;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintStream;
import java.io.Writer;
import java.nio.file.DirectoryNotEmptyException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.zip.ZipOutputStream;

import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.emf.ecore.resource.Resource;
import org.eclipse.emf.ecore.resource.ResourceSet;
import org.eclipse.emf.ecore.resource.impl.ResourceSetImpl;
import org.eclipse.emf.ecore.xmi.impl.XMIResourceFactoryImpl;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.web.util.HtmlUtils;

import de.tu_bs.cs.isf.cbc.cbcmodel.AbstractStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.CbCFormula;
import de.tu_bs.cs.isf.cbc.cbcmodel.CbcmodelFactory;
import de.tu_bs.cs.isf.cbc.cbcmodel.CbcmodelPackage;
import de.tu_bs.cs.isf.cbc.cbcmodel.CompositionStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.Condition;
import de.tu_bs.cs.isf.cbc.cbcmodel.GlobalConditions;
import de.tu_bs.cs.isf.cbc.cbcmodel.JavaVariable;
import de.tu_bs.cs.isf.cbc.cbcmodel.JavaVariables;
import de.tu_bs.cs.isf.cbc.cbcmodel.SelectionStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.SmallRepetitionStatement;
import edu.kit.cbc.web.java.compilation.WebCorcCompileJava;
import edu.kit.cbc.web.util.FileUtil;
import edu.kit.cbc.web.util.JSONBuildHelper;
import edu.kit.cbc.web.util.JSONParser;
import edu.kit.cbc.web.util.ProofType;
import edu.kit.cbc.web.util.ProveWithKey;
import edu.kit.cbc.web.util.VerifyAllStatements;

@RestController
public class WebCorCController {
	// TODO: check via session.getLastAccess if client has no folder
	// TODO: new session id is given to client - after refresh the old session id is
	// claimed again... not the desired behavior

	// continue using this directory path
	private final String SZ_LOCATION = System.getProperty("java.io.tmpdir") + File.separator + "WebCorC";
	// private final String SZ_LOCATION = "C:\\Users\\m-hor\\Desktop\\WebCorCTemp";

	@GetMapping(value = "/sessionId")
	public String getSessionId(HttpSession session) {
		// session ids should never be invalidated (maybe an other place for this?)
		session.setMaxInactiveInterval(0);
		System.out.println(SZ_LOCATION);
		return session.getId();
	}

	@GetMapping(path = "/getWorkspaceAsArchive")
	public ResponseEntity<StreamingResponseBody> downloadZip(HttpServletResponse response, HttpSession session) {

		return ResponseEntity.ok().header("Content-Disposition", "attachment;filename=export.zip").body(out -> {
			final ZipOutputStream zipOutputStream = new ZipOutputStream(out);

			// for testing purposes: save file to directory with FileOutputStream instead of
			// StreamingResponseBody
			// Path zipPath = Paths.get(SZ_LOCATION + File.separator + "test.zip");
			// final ZipOutputStream zos = new ZipOutputStream(new
			// FileOutputStream(zipPath.toFile()));

			File directory = new File(SZ_LOCATION + File.separator + session.getId());

			System.out.println("zipping...");

			FileUtil.zipDirectory(directory, SZ_LOCATION + File.separator + session.getId(), zipOutputStream);
			// FileUtil.zipDirectory(directory, SZ_LOCATION + File.separator +
			// session.getId(), zos);

			System.out.println("directory zipped, shipping...");

			// }

		});
	}

	@RequestMapping(value = "/deleteFileOrFolder", method = RequestMethod.POST)
	public void deleteFileOrFolder(@RequestBody String fileAndContent, HttpSession session) throws IOException {
		JSONObject jObj = new JSONObject(fileAndContent);

		System.out.println("delete: " + fileAndContent);

		String pathString = JSONParser.getPathString(jObj, session);
		String nameString = JSONParser.getNameString(jObj);

		String systemPath = SZ_LOCATION + File.separator + pathString + File.separator + nameString;

		if (Files.isDirectory(Path.of(systemPath))) {
			File file = new File(systemPath);
			deleteRecursively(file);
		} else {
			try {
				Files.delete(Path.of(systemPath));
			} catch (NoSuchFileException x) {
				System.err.format("%s: no such" + " file or directory%n", Path.of(systemPath));
			} catch (DirectoryNotEmptyException x) {
				System.err.format("%s not empty%n", Path.of(systemPath));
			} catch (IOException x) {
				// File permission problems are caught here.
				System.err.println(x);
			}
		}

		System.out.println("Element deleted");

	}

	private boolean deleteRecursively(File directoryToBeDeleted) {
		// TODO Auto-generated method stub

		File[] allContents = directoryToBeDeleted.listFiles();
		if (allContents != null) {
			for (File file : allContents) {
				deleteRecursively(file);
			}
		}
		return directoryToBeDeleted.delete();
	}

	@RequestMapping(value = "/saveFile", method = RequestMethod.POST)
	public void saveFileToDisk(@RequestBody String fileAndContent, HttpSession session) throws IOException {
		// TODO: if the file is not existing: create one
		JSONObject jObj = new JSONObject(fileAndContent);

		System.out.println(fileAndContent);

		String pathString = JSONParser.getPathString(jObj, session);
		String nameString = JSONParser.getNameString(jObj);
		String content = JSONParser.getContentString(jObj);
		String systemPath = SZ_LOCATION + File.separator + pathString + File.separator + nameString;

		Writer writer = new FileWriter(systemPath, false);
		writer.write(content);
		writer.close();

		// Files.writeString(path, content, StandardOpenOption.APPEND );

		System.out.println("File saved");

	}

	@RequestMapping(value = "/createFile", method = RequestMethod.POST)
	public String createNewFile(@RequestBody String fileAndContent, HttpSession session) {
		// file content is most likely an empty string. May be different with other
		// usages in the future.
		JSONObject jObj = new JSONObject(fileAndContent);

		String pathString = JSONParser.getPathString(jObj, session);
		String nameString = JSONParser.getNameString(jObj);
		String systemPath = SZ_LOCATION + File.separator + pathString + File.separator + nameString;
		String content = JSONParser.getContentString(jObj);

		File newFile = new File(systemPath);
		try {
			if (newFile.createNewFile()) {
				System.out.println("File created: " + newFile.getName());
				Writer writer = new FileWriter(systemPath, false);
				writer.write(content);
				writer.close();
				return "File " + newFile.getName() + " created successfully";
			} else {
				System.out.println("File already exists.");
				return "File " + newFile.getName() + " already exists";
			}
		} catch (IOException e) {
			e.printStackTrace();
			return e.getMessage();
		}
	}

	@RequestMapping(value = "/createDirectory", method = RequestMethod.POST)
	public String createNewDirectory(@RequestBody String fileAndContent, HttpSession session) {
		// file content is most likely an empty string. May be different with other
		// usages in the future.
		JSONObject jObj = new JSONObject(fileAndContent);

		String pathString = JSONParser.getPathString(jObj, session);
		String nameString = JSONParser.getNameString(jObj);
		String systemPath = SZ_LOCATION + File.separator + pathString + File.separator + nameString;

		try {
			Files.createDirectories(Paths.get(systemPath));
			return "Directory " + nameString + " created successfully";
		} catch (IOException e) {
			e.printStackTrace();
			return e.getMessage();
		}
	}

	@RequestMapping(value = "/getFileAtPath", method = RequestMethod.POST)
	public String deliverFileAtPath(@RequestBody String pathString, HttpSession session) throws IOException {
		String[] pathParts = pathString.split("/");
		pathString = String.join(File.separator, pathParts);
		Path path = Path.of(SZ_LOCATION + File.separator + session.getId() + File.separator + pathString);
		System.out.println(path);

		return Files.readString(path);
	}

	@RequestMapping(value = "/initialize", method = RequestMethod.POST)
	public String initializeWorkspace(HttpSession session) {
		// if (!session.getId().equals(sessionId)) {
		// System.out.println("Session Id proplem occured! At this point of
		// implementation, this should not be the case!");
		// }

		// check if there is an existing folder named sessionId. If not - create new
		// "web workspace"
		JSONObject webDirectory = new JSONObject();
		if (new File(SZ_LOCATION + File.separator + session.getId()).exists()) {
			System.out.println("Folder found for SessionId: " + session.getId());

		} else {
			System.out.println("No existing folder... Creating new directory! For SessionId: " + session.getId());
			// directory : folder named after sessionId -> web directory tree, .meta,
			// proofData
			File newRootDir = new File(SZ_LOCATION + File.separator + session.getId());
			File newSubDir = new File(SZ_LOCATION + File.separator + session.getId() + File.separator + "WebDirectory");
			File newSubDirMeta = new File(SZ_LOCATION + File.separator + session.getId() + File.separator + ".meta");
			File newSubDirProof = new File(
					SZ_LOCATION + File.separator + session.getId() + File.separator + "ProofData");
			File newSubDirHelper = new File(
					SZ_LOCATION + File.separator + session.getId() + File.separator + "HelperFiles");
			try {
				Files.createDirectories(newRootDir.toPath());
			} catch (IOException e) {
				System.out.println(e.getMessage());
			}
			newSubDir.mkdir();
			newSubDirMeta.mkdir();
			newSubDirProof.mkdir();
			newSubDirHelper.mkdir();

		}
		webDirectory.put("directory",
				JSONBuildHelper.buildDirectoryJSON(SZ_LOCATION + File.separator + session.getId()));
		return webDirectory.toString();
	}

	@RequestMapping(value = "/javaCodeAsString", method = RequestMethod.POST, consumes = "text/plain")
	public String javaCodeComp(@RequestBody String javaCodeBlock) {
		WebCorcCompileJava javaCompiler = new WebCorcCompileJava();
		// TODO: compile message in JSON format: like message with message-string and
		// also other useful information like the line separated
		return javaCompiler.compileJavaString(javaCodeBlock);
	}

	@Deprecated
	@RequestMapping(value = "/helperFileUpload", method = RequestMethod.POST)
	public String uploadHelperFile(@RequestParam("file") MultipartFile file, HttpSession session) {
		String szSessionId = session.getId();
		// TODO: get information about the corresponding diagram and put in prove_xProof
		// folder
		// File keyHelperFile = new File(URI
		// .createFileURI(SZ_LOCATION + File.separator + szSessionId + File.separator +
		// "HelperFiles" + File.separator + "helper.key").toFileString());
		// fixed path for testing purposes
		File keyHelperFile = new File(URI.createFileURI(
				SZ_LOCATION + File.separator + szSessionId + File.separator + "WebDirectory" + File.separator
						+ "LinearSearch" + File.separator + "prove_linearSearchProof" + File.separator + "helper.key")
				.toFileString());
		try {
			keyHelperFile.getParentFile().mkdirs();
			file.transferTo(keyHelperFile);
		} catch (IllegalStateException e) {
			e.printStackTrace();
			return "Upload of file failed: " + e.getMessage();
		} catch (IOException e) {
			e.printStackTrace();
			return "Upload of file failed: " + e.getMessage();
		}

		return "Upload of file successful";
	}

	@RequestMapping(value = "/uploadWorkspaceAsArchive", method = RequestMethod.POST)
	public String uploadWorkspace(@RequestParam("file") MultipartFile file, HttpSession session) {
		Path target = Paths.get(SZ_LOCATION + File.separator + session.getId());
		try {
			File source = new File(SZ_LOCATION + File.separator + session.getId() + File.separator + ".meta"
					+ File.separator + "temp.zip");
			file.transferTo(source);
			FileUtil.unzipDirectory(source, target);
		} catch (IOException e) {
			System.out.println(e.getMessage());
		}
		return "";
	}

	@RequestMapping(value = "/uploadFileToPath", method = RequestMethod.POST)
	public String uploadFile(@RequestParam("file") MultipartFile file, @RequestParam("pathCurrentDir") String path,
			HttpSession session) {
		// public String uploadFile(@RequestBody String whatIsIt, HttpSession session) {
		String sessionId = session.getId();
		File newFile = new File(SZ_LOCATION + File.separator + sessionId + File.separator
				+ path.replace("treeView", "WebDirectory") + File.separator + file.getOriginalFilename());
		try {
			if (newFile.createNewFile()) {
				System.out.println("File created: " + newFile.getName());
				file.transferTo(newFile);
				return "File " + newFile.getName() + " created successfully";
			} else {
				System.out.println("File already exists, updated File.");
				file.transferTo(newFile);
				return "File " + newFile.getName() + " already exists, updated File";
			}
		} catch (IOException e) {
			e.printStackTrace();
			return e.getMessage();
		}
	}

	@Deprecated
	@RequestMapping(value = "/javaFileUpload", method = RequestMethod.POST)
	public String uploadJavaFile(@RequestParam("file") MultipartFile file, HttpSession session) {
		String szSessionId = session.getId();
		File keyJavaFile = new File(
				URI.createFileURI(SZ_LOCATION + "/" + "Proofs" + "/" + szSessionId + "/Java/" + "UserCode.java")
						.toFileString());
		File keyJavaFileSnapshot = new File(URI.createFileURI(SZ_LOCATION + "/" + "Proofs" + "/" + szSessionId
				+ "/JavaSnapshots/" + String.valueOf(System.currentTimeMillis()) + "_UserCode.java").toFileString());
		try {
			keyJavaFile.getParentFile().mkdirs();
			file.transferTo(keyJavaFile);
			keyJavaFileSnapshot.getParentFile().mkdirs();
			Files.copy(keyJavaFile.toPath(), keyJavaFileSnapshot.toPath(), StandardCopyOption.REPLACE_EXISTING);
		} catch (IllegalStateException e) {
			e.printStackTrace();
			return "Upload of file failed: " + e.getMessage();
		} catch (IOException e) {
			e.printStackTrace();
			return "Upload of file failed: " + e.getMessage();
		}

		boolean result = ProveWithKey.proveJavaWithKey(keyJavaFile);
		return "Proof is closed: " + result;
	}

	@Deprecated
	@RequestMapping(value = "/verifyAll", method = RequestMethod.POST, consumes = "application/json")
	public String processJson(@RequestBody String requestPayload, HttpSession session) {
		String szSessionId = session.getId();
		// Parsing the JSON-tree and create the EObject with the CbcmodelFactory,
		// unescaping necessary of HTML entities
		JSONObject jObjTree = new JSONObject(HtmlUtils.htmlUnescape(requestPayload));
		jObjTree = jObjTree.getJSONObject("CorcInput");
		// Initializations and registrations

		// Ecore Magie
		{
			// Ecore aufwecken / initialisieren!?
			CbcmodelPackage.eINSTANCE.eClass();
			// Ecore file extension registry holen und .cbcmode erweiterung mit XMI
			// resources mappen
			Resource.Factory.Registry reg = Resource.Factory.Registry.INSTANCE;
			Map<String, Object> m = reg.getExtensionToFactoryMap();
			m.put("cbcmodel", new XMIResourceFactoryImpl());
		}

		// ressourcen liste um ressourcen zu erstellen
		ResourceSet rs = new ResourceSetImpl();

		// Create resource & model instance
		// name einfach um das von der nächsten verifikation zu unterscheiden
		String szPathName = System.currentTimeMillis() + "_" + jObjTree.getString("name").replace(" ", "")
				+ ".cbcmodel";
		// ressource mithilfe vom ressource set erstellen --> vielleicht nicht jedes mal
		// ein neues set?
		Resource rResource = rs
				.createResource(URI.createFileURI(SZ_LOCATION + "/" + "Proofs" + "/" + szSessionId + "/" + szPathName));

		// add variables and global conditions
		JavaVariables jvVars = CbcmodelFactory.eINSTANCE.createJavaVariables();

		JSONArray jArrVariables = jObjTree.getJSONArray("javaVariables");
		for (int i = 0; i < jArrVariables.length(); i++) {
			JavaVariable jvVar = CbcmodelFactory.eINSTANCE.createJavaVariable();
			jvVar.setName(jArrVariables.getString(i));
			jvVars.getVariables().add(jvVar);
		}

		// hier das gleiche
		GlobalConditions gcConditions = CbcmodelFactory.eINSTANCE.createGlobalConditions();
		JSONArray jArrGlobals = jObjTree.getJSONArray("globalConditions");
		for (int i = 0; i < jArrGlobals.length(); i++) {
			Condition gc = CbcmodelFactory.eINSTANCE.createCondition();
			gc.setName(jArrGlobals.getString(i));
			gcConditions.getConditions().add(gc);
		}

		rResource.getContents().add(jvVars);
		rResource.getContents().add(gcConditions);

		// initiate recursive parsing, also adding the formula to the rResource
		JSONParser.parseFormulaTree(jObjTree, rResource, null);

		try {
			rResource.save(Collections.EMPTY_MAP);
		} catch (IOException e) {
			e.printStackTrace();
		}

		// Verify model, result be written into the resource
		VerifyAllStatements.verify(rResource, rResource.getURI());
		szPathName = System.currentTimeMillis() + "_" + jObjTree.getString("name").replace(" ", "")
				+ "_evaluated.cbcmodel";
		rResource.setURI(URI.createFileURI(SZ_LOCATION + "/" + "Proofs" + "/" + szSessionId + "/" + szPathName));

		try {
			rResource.save(Collections.EMPTY_MAP);
		} catch (IOException e) {
			e.printStackTrace();
		}

		CbCFormula formula = null;
		for (EObject eObj : rResource.getContents()) {
			if (eObj instanceof CbCFormula) {
				formula = (CbCFormula) eObj;
			}
		}

		JSONParser.createJSONResponse(jObjTree, formula.getStatement());
		JSONObject jObjResponse = new JSONObject();
		jObjResponse.put("sessionId", szSessionId);
		jObjResponse.put("CorcOutput", jObjTree);

		return jObjResponse.toString();
	}

	@RequestMapping(value = "/verifyDiagramFile", method = RequestMethod.POST, consumes = "application/json")
	public String processDiagramFileVerification(@RequestBody String fileAndContent, HttpSession session) {
		String szSessionId = session.getId();
		JSONObject jObj = new JSONObject(fileAndContent);
		JSONObject jObjTree = jObj.getJSONObject("content");
		jObjTree = jObjTree.getJSONObject("CorcInput");
		String pathString = JSONParser.getPathString(jObj, session);
		String fileName = JSONParser.getNameString(jObj);
		// File proofFolder = new File(SZ_LOCATION + File.separator + pathString +
		// File.separator
		// + JSONParser.getNameString(jObj).replace(".diagram", "") + "Proof");
		String proofFolderPath = SZ_LOCATION + File.separator + pathString + File.separator
				+ JSONParser.getNameString(jObj).replace(".diagram", "");
		// try {
		// Files.createDirectories(proofFolder.toPath());
		// }
		// catch(Exception e){}
		// Initializations and registrations

		// Ecore Magie
		{
			// Ecore aufwecken / initialisieren!?
			CbcmodelPackage.eINSTANCE.eClass();
			// Ecore file extension registry holen und .cbcmode erweiterung mit XMI
			// resources mappen
			Resource.Factory.Registry reg = Resource.Factory.Registry.INSTANCE;
			Map<String, Object> m = reg.getExtensionToFactoryMap();
			m.put("cbcmodel", new XMIResourceFactoryImpl());
		}

		// ressourcen liste um ressourcen zu erstellen
		ResourceSet rs = new ResourceSetImpl();

		// Create resource & model instance
		// name einfach um das von der nächsten verifikation zu unterscheiden
		String szPathName = System.currentTimeMillis() + "_" + jObjTree.getString("name").replace(" ", "")
				+ ".cbcmodel";
		// ressource mithilfe vom ressource set erstellen --> vielleicht nicht jedes mal
		// ein neues set?
		Resource rResource = rs.createResource(URI.createFileURI(
				SZ_LOCATION + File.separator + szSessionId + File.separator + ".meta" + File.separator + szPathName));

		// add variables and global conditions
		JavaVariables jvVars = CbcmodelFactory.eINSTANCE.createJavaVariables();

		JSONArray jArrVariables = jObjTree.getJSONArray("javaVariables");
		for (int i = 0; i < jArrVariables.length(); i++) {
			JavaVariable jvVar = CbcmodelFactory.eINSTANCE.createJavaVariable();
			jvVar.setName(jArrVariables.getString(i));
			jvVars.getVariables().add(jvVar);
		}

		// hier das gleiche
		GlobalConditions gcConditions = CbcmodelFactory.eINSTANCE.createGlobalConditions();
		JSONArray jArrGlobals = jObjTree.getJSONArray("globalConditions");
		for (int i = 0; i < jArrGlobals.length(); i++) {
			Condition gc = CbcmodelFactory.eINSTANCE.createCondition();
			gc.setName(jArrGlobals.getString(i));
			gcConditions.getConditions().add(gc);
		}

		rResource.getContents().add(jvVars);
		rResource.getContents().add(gcConditions);

		// initiate recursive parsing, also adding the formula to the rResource
		JSONParser.parseFormulaTree(jObjTree, rResource, null);

		try {
			rResource.save(Collections.EMPTY_MAP);
		} catch (IOException e) {
			e.printStackTrace();
		}

		// Verify model, result be written into the resource
		VerifyAllStatements.verify(rResource, URI.createFileURI(proofFolderPath));
		szPathName = System.currentTimeMillis() + "_" + jObjTree.getString("name").replace(" ", "")
				+ "_evaluated.cbcmodel";
		rResource.setURI(URI.createFileURI(
				SZ_LOCATION + File.separator + szSessionId + File.separator + ".meta" + File.separator + szPathName));

		try {
			rResource.save(Collections.EMPTY_MAP);
		} catch (IOException e) {
			e.printStackTrace();
		}

		CbCFormula formula = null;
		for (EObject eObj : rResource.getContents()) {
			if (eObj instanceof CbCFormula) {
				formula = (CbCFormula) eObj;
			}
		}

		JSONParser.createJSONResponse(jObjTree, formula.getStatement());
		JSONObject jObjResponse = new JSONObject();
		jObjResponse.put("sessionId", szSessionId);
		jObjResponse.put("CorcOutput", jObjTree);

		// TODO: auslagern (save content to file)
		// File newFile = new File(SZ_LOCATION + File.separator + pathString +
		// File.separator + fileName);
		// try {
		// if (newFile.createNewFile()) {
		// System.out.println("File created: " + newFile.getName());
		// } else {
		// System.out.println("File already exists.");
		// }
		// Writer writer = new FileWriter(SZ_LOCATION + File.separator + pathString +
		// File.separator + fileName, false);
		// writer.write(jObjResponse.toString());
		// writer.close();
		// } catch (IOException e) {
		// e.printStackTrace();
		// }

		// TODO: also save response to file -> pathString
		return jObjResponse.toString();
	}

	@RequestMapping(value = "/verifyStatement", method = RequestMethod.POST, consumes = "application/json")
	public String processSingleStatementVerification(@RequestHeader String statementId, @RequestHeader String proofType,
			@RequestBody String fileAndContent, HttpSession session) {
		// Start buffering stdout, emitted messages will be sent to client
		ByteArrayOutputStream operationLog =  new ByteArrayOutputStream();
		PrintStream buffer = new PrintStream(operationLog);
		PrintStream former = System.out;
		System.setOut(buffer);
		// TODO Update client-side implementation to ensure that proof type and statement ID is sent
		String szSessionId = session.getId();
		JSONObject jObj = new JSONObject(fileAndContent);
		JSONObject jObjTree = jObj.getJSONObject("content");
		jObjTree = jObjTree.getJSONObject("CorcInput");
		String pathString = JSONParser.getPathString(jObj, session);
		String proofFolderPath = SZ_LOCATION + File.separator + pathString + File.separator
				+ JSONParser.getNameString(jObj).replace(".diagram", "");
		{
			// Initialise ECore
			CbcmodelPackage.eINSTANCE.eClass();
			// Use .cbcmodel file extension for ECore data
			// See called getExtensionToFactoryMap method for more details
			Resource.Factory.Registry reg = Resource.Factory.Registry.INSTANCE;
			Map<String, Object> m = reg.getExtensionToFactoryMap();
			m.put("cbcmodel", new XMIResourceFactoryImpl());
		}

		// Create empty set of resources
		ResourceSet rs = new ResourceSetImpl();

		/* Create the resource corresponding to the received JSON data */ 
		
		// Save ECore file, use current millisecond timestamp as file name
		String szPathName = System.currentTimeMillis() + "_" + jObjTree.getString("name").replace(" ", "")
				+ ".cbcmodel";
		
		Resource rResource = rs.createResource(URI.createFileURI(
				SZ_LOCATION + File.separator + szSessionId + File.separator + ".meta" + File.separator + szPathName));

		// Extract list of global variables (read from dedicated field in JSON schema)
		JavaVariables jvVars = CbcmodelFactory.eINSTANCE.createJavaVariables();
		JSONArray jArrVariables = jObjTree.getJSONArray("javaVariables");
		for (int i = 0; i < jArrVariables.length(); i++) {
			JavaVariable jvVar = CbcmodelFactory.eINSTANCE.createJavaVariable();
			jvVar.setName(jArrVariables.getString(i));
			jvVars.getVariables().add(jvVar);
		}
		
		// Extract list of global conditions (read from dedicated field in JSON schema)
		GlobalConditions gcConditions = CbcmodelFactory.eINSTANCE.createGlobalConditions();
		JSONArray jArrGlobals = jObjTree.getJSONArray("globalConditions");
		for (int i = 0; i < jArrGlobals.length(); i++) {
			Condition gc = CbcmodelFactory.eINSTANCE.createCondition();
			gc.setName(jArrGlobals.getString(i));
			gcConditions.getConditions().add(gc);
		}

		// Push extracted material in the previously initialised resource
		rResource.getContents().add(jvVars);
		rResource.getContents().add(gcConditions);

		// Parse JSON data into AST
		JSONParser.parseFormulaTree(jObjTree, rResource, null);

		try {
			rResource.save(Collections.EMPTY_MAP);
		} catch (IOException e) {
			e.printStackTrace();
		}

		// Extract the AST just pushed in by parseFormulaTree
		CbCFormula ft = (CbCFormula) rResource.getContents().stream().filter(eObject -> eObject instanceof CbCFormula)
				.findFirst().orElse(null);
		/*
		 * This is not very type-safe but due to the way ECore resources are built there
		 * is no better way of extracting the formula tree
		 */
		AbstractStatement rootStatement = ft.getStatement();
		AbstractStatement extractedStatement = extractStatement(rootStatement, statementId);
		// This method call might look odd, but we are effectively mimicking VerifyAllStatements:40 here
		extractedStatement.setProven(VerifyAllStatements.proveStatement(extractedStatement.getRefinement(), jvVars, gcConditions, null, URI.createFileURI(proofFolderPath), ProofType.valueOf(proofType)));
		refreshProofState(extractedStatement.getRefinement());

		// Create new ECore file after evaluating the relevant statement and refreshing the proof state of the diagram
		szPathName = System.currentTimeMillis() + "_" + jObjTree.getString("name").replace(" ", "")
				+ "_evaluated.cbcmodel";
		rResource.setURI(URI.createFileURI(
				SZ_LOCATION + File.separator + szSessionId + File.separator + ".meta" + File.separator + szPathName));

		try {
			rResource.save(Collections.EMPTY_MAP);
		} catch (IOException e) {
			e.printStackTrace();
		}

		CbCFormula formula = null;
		for (EObject eObj : rResource.getContents()) {
			if (eObj instanceof CbCFormula) {
				formula = (CbCFormula) eObj;
			}
		}

		JSONParser.createJSONResponse(jObjTree, formula.getStatement());
		JSONObject jObjResponse = new JSONObject();
		jObjResponse.put("sessionId", szSessionId);
		jObjResponse.put("CorcOutput", jObjTree);
		jObjResponse.put("messages", operationLog.toString());
		
		// Switch back to stdout
		System.setOut(former);
		return jObjResponse.toString();
	}

	private void refreshProofState(EObject ft) {
		/*
		 * Here WebCorc should simply refresh the proof state of the formula tree,
		 * ensuring that the tree is an consistent state (this might not always be the
		 * case if a single-proof statement was done)
		 */
		if (ft instanceof SmallRepetitionStatement) {
			SmallRepetitionStatement srs = (SmallRepetitionStatement) ft;
			srs.setProven(srs.isPostProven() && srs.isPreProven() && srs.isVariantProven()
					&& srs.getLoopStatement().isProven());
		} else if (ft instanceof CompositionStatement) {
			CompositionStatement cs = (CompositionStatement) ft;
			/* Missing refinements are evaluated as null. We filter these out before calling isProven on the stream */
			cs.setProven(List.of(cs.getFirstStatement().getRefinement(), cs.getSecondStatement().getRefinement()).stream()
					.filter(e -> e != null).allMatch(e -> e.isProven()));
			// TODO Evaluate non-existent children as false
		} else if (ft instanceof SelectionStatement) {
			// See previous comment
			SelectionStatement ss = (SelectionStatement) ft;
			ss.setProven(ss.isPreProve() && ss.getCommands().stream().map(e -> e.getRefinement()).filter(e -> e != null)
					.allMatch(e -> e.isProven()));
		} else if (ft instanceof CbCFormula) {
			CbCFormula cbcf = (CbCFormula) ft;
			cbcf.setProven(cbcf.getStatement().getRefinement().isProven());
			return;
		}
		EObject parent = ((AbstractStatement) ft).getParent().eContainer();
		if (parent != null) refreshProofState(parent);
		return;
	}
	
	private AbstractStatement extractStatement(AbstractStatement ft, String statementId) {
		if (ft.getRefinement().getId().equals(statementId))
			return ft;
		if (ft instanceof SmallRepetitionStatement) {
			return extractStatement(((SmallRepetitionStatement) ft).getLoopStatement(), statementId);
		} else if (ft instanceof CompositionStatement) {
			return Optional.ofNullable(extractStatement(((CompositionStatement) ft).getFirstStatement().getRefinement(), statementId))
					.orElse(extractStatement(((CompositionStatement) ft).getSecondStatement().getRefinement(), statementId));
		} else if (ft instanceof SelectionStatement) {
			SelectionStatement ss = (SelectionStatement) ft;
			for (AbstractStatement command : ss.getCommands()) {
				extractStatement(command, statementId);
			}
		} else if (ft instanceof AbstractStatement) {
			// Do nothing as we have reached a leaf
		}
		return null;
	}
}
