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
/// <reference path="logging.ts" />

import * as WebSocket from 'ws';
import { sha3_256 } from 'js-sha3';
import * as Crypto from 'crypto';
import { Logger } from './logging';

/**
 * User
 * 
 * Describes a client/user of KentChat
 */
export class User {
    public isLoggedIn: boolean = false;
    public isEncrypted: boolean = false;
    public identifier: string;
    public publicKey: string;
    public hashedAccountUsername: string;
    public connection: WebSocket.WebSocket;
    
    /**
     * User constructor
     * 
     * Constructs a new user with the specified public key. Such key is required for user construction. For more info, see protocol.md. Meant to be called during 'connection' event handling by the server.
     */
    constructor(conn: WebSocket.WebSocket, pubkey: string) {
        this.publicKey = pubkey;
        this.connection = conn;
    }

    rawSend(data: any) {
        Logger.into(`[${this}].rawSend`);
        if (this.connection.readyState === WebSocket.WebSocket.OPEN) {
            this.connection.send(data, err => {
                Logger.log('error', `Error while sending to connection; Stack:\n${err.stack}`);
            });
        }
    }

    toString(): string {
        return `User<pub-prefix=${this.publicKey.slice(0, 6)}>`;
    }
}