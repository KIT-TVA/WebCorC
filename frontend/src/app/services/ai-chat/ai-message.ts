

type messageRoles = "developer" | "user" | "assistant"

/**
 * Class to manage the ai message used in the ai chat component and service.
 */
export class AiMessage {
    private _id : number
    private _content : string
    private _role : messageRoles

    constructor(id : number,content : string, isResponse : boolean = false) {
        this._id = id
        this._content = content
        this._role = isResponse ? "assistant" : "user"
    }

    public get content() : string {
        return this._content
    }

    public get isResponse() : boolean {
        return this._role === "assistant"
    }

    public get id() : number {
        return this._id
    }

    /**
     * Export to open ai compatible message for processing via api calls.
     */
    public export() : OpenAiMessage {
        return {role : this._role, content: this._content}
    }
}


/**
 * Message in the input of the {@see OpenAiRequest } 
 */
export interface OpenAiMessage {
    role : string
    content : string
}

/**
 * Request body of the response api of openai {@see https://platform.openai.com/docs/api-reference/responses/create}
 */
export interface OpenAiRequest {
    model : string
    input : OpenAiMessage[]
}

/**
 * Content of the output of the OpenAiReponse {@see OpenAiOutput }
 */
export interface OpenAiOutputContent {
    type : string
    text : string
    annotations : []
}

/**
 * Single element in the output of the OpenAiResponse which includes meta data
 * {@see OpenAiResponse }
 * 
*/
export interface OpenAiOutput {
    type : string
    id : string
    status : string
    role : messageRoles
    content : OpenAiOutputContent[]
}

/**
 * Response of the openai responses api. Not complete
 * {@see https://platform.openai.com/docs/api-reference/responses/create}
 */
export interface OpenAiResponse {
    id : string
    object : string
    created : number
    status : string
    error : string | null
    incomplete_details : string | null
    instructions : string | null
    max_output_tokens : null
    model : string
    output : OpenAiOutput[]
}