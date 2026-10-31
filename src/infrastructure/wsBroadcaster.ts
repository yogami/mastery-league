import type { Server as HttpServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import type { ClassroomSession } from '../domain/types.js';
import type { ClassroomBroadcasterPort } from '../ports/broadcasterPort.js';

interface ClientSubscriptionMsg {
  readonly type?: string;
  readonly pin?: string;
}

export class WsClassroomBroadcaster implements ClassroomBroadcasterPort {
  private readonly subscriptions = new Map<WebSocket, string>();
  private wss?: WebSocketServer;

  public attach(httpServer: HttpServer): void {
    this.wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    this.wss.on('connection', (socket) => this.handleConnection(socket));
  }

  private handleConnection(socket: WebSocket): void {
    socket.on('message', (raw) => this.handleClientMessage(socket, raw.toString()));
    socket.on('close', () => {
      this.subscriptions.delete(socket);
    });
  }

  private handleClientMessage(socket: WebSocket, payload: string): void {
    try {
      const parsed = JSON.parse(payload) as ClientSubscriptionMsg;
      this.registerIfSubscribe(socket, parsed);
    } catch {
      // Ignore malformed client WS frames
    }
  }

  private registerIfSubscribe(socket: WebSocket, msg: ClientSubscriptionMsg): void {
    if (msg.type !== 'subscribe') {
      return;
    }
    if (typeof msg.pin === 'string') {
      this.subscriptions.set(socket, msg.pin);
    }
  }

  public broadcastSessionUpdate(session: ClassroomSession): void {
    const frame = JSON.stringify({
      type: 'session_updated',
      pin: session.pin,
      session
    });
    this.subscriptions.forEach((pin, socket) => {
      this.sendIfMatchingOpenSocket(socket, pin, session.pin, frame);
    });
  }

  private sendIfMatchingOpenSocket(
    socket: WebSocket,
    subscribedPin: string,
    targetPin: string,
    frame: string
  ): void {
    if (subscribedPin !== targetPin) {
      return;
    }
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(frame);
    }
  }
}
