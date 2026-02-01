import { Subject } from "rxjs";

export class WebSocketService {
    private socket: WebSocket;
    private messagesSubject = new Subject<string>();
    public messages$ = this.messagesSubject.asObservable();

    constructor(url: string) {
        this.socket = new WebSocket(url);

        this.socket.onopen = (event) => {
            console.log("Websocket connected:", event);
        };

        this.socket.onmessage = (event) => {
            const message = event.data;
            this.messagesSubject.next(message);
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
