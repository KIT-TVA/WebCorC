import { CBCFormula } from "../../services/project/CBCFormula"
import { ProjectDirectory } from "../../services/project/project-directory"
import { ProjectElement } from "../../services/project/project-element"
import { CodeFile, DiagramFile } from "../../services/project/project-files"

/**
 * See openapi/schema/file/inode.yml
 */
export interface Inode {
    urn : string
    inodeType: string
    import() : ProjectElement
}

/**
 * See openapi/schema/file/directory.yml
 */
export class ApiDirectory implements Inode {

    public constructor(
        public urn : string,
        public content : Inode[],
        public inodeType : string = "directory"
    ) {}

    public import(parentPath : string = "") : ProjectDirectory {
        const childs : ProjectElement[] = []

        let path = parentPath + this.urn + "/"
        if (parentPath == "" && this.urn == "") {
            path = ""
        }

        for (const child of this.content) {
            if (child.inodeType == "directory") {
                childs.push(new ApiDirectory(child.urn, (child as ApiDirectory).content).import(path))
            }
            if (child.inodeType == "file") {
                childs.push(new ApiFile(child.urn, child.inodeType, (child as ApiFile).type).import(path))
            }
        }

        return new ProjectDirectory(parentPath, this.urn, childs)
    }
}

/**
 * Possible types of files in the project directory
 */
export type ApiFileType = "key" | "prove" | "java" | "diagram" | "other"


/**
 * See openapi/schema/file/diagramm.yml
 */
export class ApiFile implements Inode {

    public constructor(
        public urn : string,
        public inodeType : string = "file",
        public type : ApiFileType
    ) {}

    public import(parentPath : string = "") : ProjectElement {
        let name = this.urn.substring(0, this.urn.lastIndexOf("."))
        return new DiagramFile(parentPath, name, this.type)
    }
}

/**
 * See openapi/schema/file/diagramm.ymlif (this.type === "java" || this.type === "key" || this.type === "prove") {
 */
export class ApiDiagrammFile implements Inode {

    public constructor(
        public urn : string,
        public content : CBCFormula, 
        public inodeType : string = "file",
    ) {}

    public import(parentPath : string = ""): DiagramFile {

        return new DiagramFile(parentPath, this.urn.substring(0, this.urn.lastIndexOf(".")))
    }
}

/**
 * See openapi/schema/file/java.yml
 * See openapi/schema/file/key.yml
 */
export class ApiTextFile implements Inode {
    public constructor(
        public urn : string,
        public content : string,
        public inodeType : string = "file",
    ) {}

    public import(parentPath : string  = "") : CodeFile {

        return new CodeFile(parentPath, this.urn.substring(0, this.urn.lastIndexOf(".")))
    }
}