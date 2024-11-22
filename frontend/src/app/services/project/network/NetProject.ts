import { ApiDirectory } from "../types/api-elements"

export interface NetProject {
    id : string,
    name: string,
    dateCreated: Date
    files : ApiDirectory
}