

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
     * Export to LLM-compatible message for processing via api calls.
     */
    public export() : LLMMessage {
        return {role : this._role, content: this._content}
    }
}


/**
 * Single message in the input of the LLM request.
 */
export interface LLMMessage {
    role : string
    content : string
}

/**
 * Available LLM provider identifiers matching the backend enum.
 */
export type LLMProviderType = "OPENAI" | "ANTHROPIC" | "XAI" | "GOOGLE"

/**
 * Request body sent to the backend /editor/askquestion endpoint.
 */
export interface LLMRequest {
    model : string
    provider : LLMProviderType
    input : LLMMessage[]
}

/**
 * Simplified response from the backend (provider-agnostic).
 */
export interface LLMResponse {
    text : string
}
