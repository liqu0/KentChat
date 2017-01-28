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

// File description: Tests for encrypt.ts
import * as En from '../encrypt';
import * as NodeRSA from 'node-rsa';
import * as assert from 'assert';

let client = new NodeRSA({b: 2048});
let clientConn = new En.EncryptedConnection(null);
clientConn.publicKey = client;
let server = new NodeRSA({b: 2048});
let serverConn = new En.EncryptedConnection(null);
serverConn.publicKey = server;

let msg0 = 'Test String';
let msg0e = En.Crypt.composePacket(msg0, serverConn, client);
let [msg0c, signatureValid] = En.Crypt.parsePacket(msg0e, clientConn, server);
assert.equal(msg0c, msg0, 'Decrypted messages do not match!');
assert(signatureValid, 'Signature is invalid!');