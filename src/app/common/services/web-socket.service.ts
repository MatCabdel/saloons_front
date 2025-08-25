import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { Message } from 'src/app/features/conversation/models/Conversation';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private _stompClient!: Client;
  private _messageSubject = new Subject<any>();

  connect(conversationId: number): void {
    this._stompClient = new Client({
      webSocketFactory: (): any => new WebSocket('ws://localhost:8080/websocket'),
      reconnectDelay: 5000,
    });

    this._stompClient.onConnect = (): any => {
      this._stompClient.subscribe(`/queue/conversation.${conversationId}`, (message: IMessage) => {
        this._messageSubject.next(JSON.parse(message.body));
      });
    };

    this._stompClient.onStompError = (frame: any): void => {
      console.error('STOMP erreur', frame);
    };

    this._stompClient.activate();
  }

  sendMessage(message: any): void {
    if (this._stompClient && this._stompClient.connected) {
      this._stompClient.publish({
        destination: '/app/chat.sendPrivateMessage',
        body: JSON.stringify(message),
      });
    }
  }

  getMessages(): Observable<Message> {
    return this._messageSubject.asObservable();
  }
}
