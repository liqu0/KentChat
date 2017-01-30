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

/**
 * Describes a barebone connection object. This class is meant to be extended from.
 * 
 * The `User` class should extend from this one.
 */
export class Connection {
    public identifier: string;
    public wsConn: WebSocket.WebSocket;
    
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
    constructor(conn: WebSocket.WebSocket) {
        this.wsConn = conn;
    }

    rawSend(data: any) {
        Logger.into(`[${this}].rawSend`);
        if (this.wsConn.readyState === WebSocket.WebSocket.OPEN) {
            this.wsConn.send(data, err => {
                Logger.fail(err, 'Error while sending to WebSocket connection');
            });
        }
    }

    toString(): string {
        return `User<ident=${this.identifier}>`;
    }
}