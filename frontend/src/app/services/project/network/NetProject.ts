import { ApiDirectory } from "../../../types/project/inode"
import { ProjectDirectory } from "../project-directory"

export interface NetProject {
    id : string,
    name: string,
    dateCreated: Date
    files : ApiDirectory
}