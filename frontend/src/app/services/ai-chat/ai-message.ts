

type messageRoles = "developer" | "user" | "assistant"

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

    public export() : OpenAiMessage {
        return {role : this._role, content: this._content}
    }
}

export interface OpenAiMessage {
    role : string
    content : string
}

export interface OpenAiRequest {
    model : string
    input : OpenAiMessage[]
}

export interface OpenAiOutputContent {
    type : string
    text : string
    annotations : []
}

export interface OpenAiOutput {
    type : string
    id : string
    status : string
    role : messageRoles
    content : OpenAiOutputContent[]
}

export interface OpenAiUsage {
    prompt_tokens : number
    completion_tokens : number
    total_tokens : number
}

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