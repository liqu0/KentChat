// Copyright (C) 2017  LiquidOxygen
// 
// This file is part of KentChat.
// 
// KentChat is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// KentChat is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with KentChat.  If not, see <http://www.gnu.org/licenses/>.
// 

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