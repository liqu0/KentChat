// Copyright (c) 2017 LiquidOxygen
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// File description: Tests for encrypt.ts
import * as En from '../encrypt';
import * as getKeyPair from 'keypair';
import * as assert from 'assert';

let client = getKeyPair();
let clientConn = new En.EncryptedConnection(null);
clientConn.publicKey = client.public;
let server = getKeyPair();
let serverConn = new En.EncryptedConnection(null);
serverConn.publicKey = server.public;

let msg0 = 'Test String';
let msg0e = En.Crypt.composePacket(msg0, serverConn, client.private);
let [msg0c, signatureValid] = En.Crypt.parsePacket(msg0e, clientConn, server.private);
assert.equal(msg0c, msg0, 'Decrypted messages do not match!');
assert(signatureValid, 'Signature is invalid!');