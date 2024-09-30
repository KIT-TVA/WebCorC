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

    public import() : ProjectDirectory {

        const lastIndexofSlash = this.urn.lastIndexOf("/")
        const parentPath = this.urn.substring(0, lastIndexofSlash - 1)
        const name = this.urn.substring(lastIndexofSlash + 1)

        const childs : ProjectElement[] = []

        for (const child of this.content) {
            if (child.inodeType == "directory") {
                childs.push(new ApiDirectory(child.urn, (child as ApiDirectory).content).import())
            }
            if (child.inodeType == "file") {
                childs.push(new ApiFile(child.urn, child.inodeType, (child as ApiFile).type).import())
            }
        }

        return new ProjectDirectory(parentPath,name, childs)
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

    public import() : ProjectElement {

        const lastIndexofSlash = this.urn.lastIndexOf("/")
        const parentPath = this.urn.substring(0, lastIndexofSlash - 1)
        const lastIndexofPoint = this.urn.lastIndexOf(".")
        const name = this.urn.substring(lastIndexofSlash + 1, lastIndexofPoint)

        // TODO: Map based on file type 
        
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

    public import(): DiagramFile {
        const lastIndexofSlash = this.urn.lastIndexOf("/")
        const parentPath = this.urn.substring(0, lastIndexofSlash - 1)
        const name = this.urn.substring(lastIndexofSlash + 1)

        return new DiagramFile(parentPath, name)
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

    public import() : CodeFile {
        const lastIndexofSlash = this.urn.lastIndexOf("/")
        const parentPath = this.urn.substring(0, lastIndexofSlash - 1)
        const name = this.urn.substring(lastIndexofSlash + 1)

        return new CodeFile(parentPath, name)
    }
}