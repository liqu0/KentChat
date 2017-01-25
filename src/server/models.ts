//    Copyright 2017 LiquidOxygen
// 
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
// 
//        http://www.apache.org/licenses/LICENSE-2.0
// 
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.

// This file is part of KentChat
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
        Logger.into(`[${this.toString()}]::rawSend`);
        if (this.connection.readyState === WebSocket.WebSocket.OPEN) {
            this.connection.send(data, err => {
                Logger.log('error', '')
            });
        }
    }

    toString(): string {
        return `User<pub-prefix=${this.publicKey.slice(0, 6)}>`;
    }
}