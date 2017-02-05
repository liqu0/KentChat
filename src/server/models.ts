// Copyright (c) 2017 LiquidOxygen
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// File description: Object models for KentChat server

/// <reference path="typings/index.d.ts" />

import * as WebSocket from 'ws';
import { Logger } from './logging';

export enum ConnectionStatusCode {
    UNINITIALIZED = 0,
    KEY_EXCHANGE = 1,
    ESTABLISHED = 2,
    CLOSING = 3,
}

export interface IConnection {
    send(data: any);
    addEventListener(listener: (evt: Buffer, self: IConnection) => any, type: string);
}

class EventHandler {
    callable: (msg: Object) => any;
    uid: number;

    constructor(fn: (msg: Object) => any) {
        this.uid = Math.floor(Math.random() * 20000);
    }

    call(msg: Object) {
        Logger.into(`EventHandler#${this.uid}`);
        this.callable(msg);
        Logger.outOf();
    }
}

/**
 * Describes a barebone connection object. This class is meant to be extended from.
 *
 * The `User` class should extend from this one.
 */
export class Connection implements IConnection {
    public identifier: string;
    public wsConn: WebSocket.WebSocket;
    public eventHandlers: {[evtName: string]: EventHandler[]};

    /**
     * Defines the status of the connection.
     * Should be incremented at certain stages of establishing and closing down the connection.
     *
     * @default
     * @since v0.0.1
     * @type {ConnectionStatusCode}
     */
    public statusCode: ConnectionStatusCode = ConnectionStatusCode.UNINITIALIZED;

    /**
     * Connection constructor
     *
     * Constructs a new connection with the specified public key. Such key is required for user construction. For more info, see protocol.md. Meant to be called during the 'connection' event handler of the WebSocket server.
     */
    constructor(conn: WebSocket.WebSocket, id?: string) {
        this.wsConn = conn;
        this.identifier = id;
        this.setOnMessage();
    }

    rawSend(data: any) {
        Logger.into(`[${this}].rawSend`);
        if (this.wsConn.readyState === WebSocket.WebSocket.OPEN) {
            this.wsConn.send(data, err => {
                Logger.fail(err, 'Error while sending to WebSocket connection');
            });
        }
    }

    protected setOnMessage() {
        this.wsConn.onmessage = evt => {
            Logger.into(`[${this}].rawReceive`);
            for (let handler of this.eventHandlers['message']) {
                handler.call(Buffer.from(evt.data));
            }
            Logger.outOf();
        };
    }

    protected unsetOnMessage() {
        this.wsConn.onmessage = null;
    }

    send(data: any) {
        this.rawSend(data);
    }

    addEventListener(listener: ((msg: Buffer, self: IConnection) => any), internalEventName: string): void {
        this.eventHandlers[internalEventName].push(new EventHandler(msg => listener(<Buffer> msg, this)));
    }

    addEventListeners(listeners: ((msg: Buffer, self: IConnection) => any)[], eventName: string): void {
        for (let listener of listeners) {
            this.addEventListener(listener, eventName);
        }
    }

    toString(): string {
        return `Connection<ident=${this.identifier}>`;
    }
}
