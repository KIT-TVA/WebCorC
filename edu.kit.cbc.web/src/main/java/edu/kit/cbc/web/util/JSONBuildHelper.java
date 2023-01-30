package edu.kit.cbc.web.util;

import java.io.File;
import java.util.Optional;

import org.json.JSONArray;
import org.json.JSONObject;

public class JSONBuildHelper {

	public static JSONArray buildDirectoryJSON(String path) {
		JSONArray directorys = new JSONArray();

		File root = new File(path);

		File[] folder = root.listFiles();

		if (folder != null) {
			for (File foldername : folder) {
//				System.out.println(foldername);
				
				JSONObject subDirectory = new JSONObject();
				if(foldername.isFile()) {
					subDirectory.put("Type", "File");
					subDirectory.put("FileType", getFileExtension(foldername.getName()));
					subDirectory.put("FileName", getFileNameWithoutExtension(foldername.getName()));
//					subDirectory.put("isCurrentFile", "false");
				}
				else {
					subDirectory.put("Type", "Folder");
					subDirectory.put("FolderName", foldername.getName());
					subDirectory.put("FolderContent", buildDirectoryJSON(foldername.toString()));
					subDirectory.put("isOpened", "false");
				}
				

				directorys.put(subDirectory);
			}
		}
		return directorys;
	}
	
	public static String getFileExtension(String filename) {
		Optional<String> opt = Optional.ofNullable(filename)
			      .filter(f -> f.contains("."))
			      .map(f -> f.substring(filename.lastIndexOf(".") + 1));
		return opt.get();
	}
	
	public static String getFileNameWithoutExtension(String filename) {
		Optional<String> opt = Optional.ofNullable(filename)
			      .filter(f -> f.contains("."))
			      .map(f -> f.substring(0, filename.lastIndexOf(".")));
		return opt.get();
	}
	
}
