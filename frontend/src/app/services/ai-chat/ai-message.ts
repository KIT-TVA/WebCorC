

type messageRoles = "developer" | "user" | "assistant"

export class AiMessage {
    private _content : string
    private _role : messageRoles
    private _includedInContext : boolean

    constructor(content : string, isResponse : boolean = false) {
        this._content = content
        this._role = isResponse ? "assistant" : "user"
        this._includedInContext = false
    }

    public get content() : string {
        return this._content
    }

    public get isResponse() : boolean {
        return this._role === "assistant"
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