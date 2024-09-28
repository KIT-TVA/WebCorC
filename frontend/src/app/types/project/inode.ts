import { CBCFormula } from "../../services/project/CBCFormula"

/**
 * See openapi/schema/file/inode.yml
 */
export interface Inode {
    urn : string
    inodeType: string
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
}

export type ApiFileType = "key" | "prove" | "java" | "diagram"


/**
 * See openapi/schema/file/diagramm.yml
 */
export class ApiFile implements Inode {

    public constructor(
        public urn : string,
        public inodeType : string = "file",
        public type : ApiFileType
    ) {}
}

/**
 * See openapi/schema/file/diagramm.yml
 */
export class ApiDiagrammFile implements Inode {

    public constructor(
        public urn : string,
        public content : CBCFormula, 
        public inodeType : string = "file",
    ) {}
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
}