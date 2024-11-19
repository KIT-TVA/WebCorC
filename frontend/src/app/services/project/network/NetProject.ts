import { ApiDirectory } from "../../../types/project/inode"

export interface NetProject {
    id : string,
    name: string,
    dateCreated: Date
    files : ApiDirectory
}