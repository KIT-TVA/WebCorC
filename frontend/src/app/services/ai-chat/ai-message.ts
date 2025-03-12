

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
}

interface OpenAiMessage {
    role : string
    content : string
}

interface OpenAiRequest {
    model : string
    messages : OpenAiMessage[]
    temperature : number
}