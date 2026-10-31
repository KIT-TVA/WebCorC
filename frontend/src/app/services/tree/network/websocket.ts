import { Subject } from "rxjs";
import { VerificationMessage } from "../../../types/VerificationMessage";

/**
 * Parses one WebSocket frame into its typed {@link VerificationMessage} envelope. A frame is
 * always JSON on this socket, never a bare string — extracted so it is testable without a
 * live WebSocket connection.
 */
export function parseVerificationMessage(data: string): VerificationMessage {
    return JSON.parse(data) as VerificationMessage;
}

/**
 * Thin wrapper around a verification job's WebSocket (`/ws/verify/{jobId}`). Emits each frame
 * as a parsed {@link VerificationMessage} rather than the raw string.
 */
export class WebSocketService {
    private socket: WebSocket;
    private messagesSubject = new Subject<VerificationMessage>();
    public messages$ = this.messagesSubject.asObservable();

    constructor(url: string) {
        this.socket = new WebSocket(url);

        this.socket.onopen = (event) => {
            console.log("Websocket connected:", event);
        };

        this.socket.onmessage = (event) => {
            this.messagesSubject.next(parseVerificationMessage(event.data));
        };

        this.socket.onerror = (event) => {
            console.error("Websocket error:", event);
            this.messagesSubject.error(event);
        };

        this.socket.onclose = (event) => {
            console.log("Websocket closed:", event);
            this.messagesSubject.complete();
        }
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.close();
        }
    }
}
