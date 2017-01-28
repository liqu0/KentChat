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

// File description: Encryption utilities for KentChat Server

/// <reference path="custom_typings/blake2js.d.ts" />

import * as Crypto from 'crypto';
import * as Blake2 from 'blake2js';
import { Connection } from './models';



/**
 * Adds encryption to the Connection class defined in models.ts.
 * 
 * Adheres by the procedures defined in protocol.md.
 * 
 * @author broad-well <michael@mcmoo.org>
 * @extends {@link Connection}
 * @since v0.0.1
 */
export class EncryptedConnection extends Connection {
    /**
     * The RSA public key of the client.
     * 
     * @type {NodeRSA}
     * @memberOf EncryptedConnection
     */
    public publicKey: any;
}

/**
 * Provides a set of encryption functions used in {@link EncryptedConnection} and other places involving encryption.
 * 
 * @author broad-well <michael@mcmoo.org>
 * @export
 * @since v0.0.1
 */
export namespace Crypt {
    /**
     * Packets sent and received are `join`ed and `split`ted with this separator.
     * 
     * @constant
     * @default
     */
    export const PACKET_SEPARATOR: string = '|';

    /**
     * The default AES key size in bytes. `crypto.randomBytes(...)` uses this number as the argument when generating a random AES key.
     * 
     * @constant
     * @default
     * @since v0.0.1
     */
    export const AES_KEY_SIZE: number = 16;

    // --- Utility functions ---

    /**
     * Encrypts the given message (in utf8) with AES-256 using the given key.
     * 
     * @static
     * @public
     * @param {string} message - The plain-text message to encrypt, in `utf8`
     * @param {Buffer} key - The key used to encrypt _(same key is used to decrypt)_
     * @returns {Buffer} Buffer containing the ciphertext
     */
    export function aesEncrypt(message: string, key: Buffer): Buffer {
        let cipher = Crypto.createCipher('aes256', key);
        cipher.update(message, 'utf8');
        return cipher.final();
    }

    /**
     * Decrypts the given message with AES-256 using the given key, then encodes the result in utf8.
     * 
     * @static
     * @public
     * @param {Buffer} data - The encrypted ciphertext, wrapped in a Buffer
     * @param {Buffer} key - The key that was originally used to encrypt the ciphertext, now used to decrypt it
     * @returns {string} The decrypted data encoded in `utf8`
     */
    export function aesDecrypt(data: Buffer, key: Buffer): string {
        let decipher = Crypto.createDecipher('aes256', key);
        decipher.update(data);
        return decipher.final('utf8');
    }

    /**
     * Hashes the given Buffer using [BLAKE2](https://blake2.net).
     * 
     * Can optionally specify the sub-algorithm of BLAKE2 to use for the hashing.
     * 'Algorithm to use can either be "blake2s", "blake2sp", "blake2b" or "blake2bp".'
     * 
     * @static
     * @public
     * @param {Buffer} data - The data that shall be hashed with BLAKE2
     * @param {string} algorithm - One of `"blake2s"`, `"blake2sp"`, `"blake2b"` or `"blake2bp"`
     * @returns {Buffer} The hash of the supplied data, wrapped in a Buffer
     */
    export function blakeHash(data: Buffer, algorithm: Blake2.Blake2Algorithm = 'blake2s'): Buffer {
        return Buffer.from(<string> Blake2.hash(algorithm, data, {}, 'hex'), 'hex');
    }

    // --- Protocol-specific gen and degen functions ---

    /**
     * Composes a packet that should be sent to the client.
     * 
     * Default AES key length is 32 bytes, default BLAKE2 algorithm is BLAKE2S.
     * 
     * @see protocol.md#server-msg-to-client for information on how a message from the server is composed
     * @export
     * @param {string} content The actual content that is meant to be sent to the client. Should be encoded with `utf8`. Example: `{"type":"tunnel","orig":"e1fcba2d"}`
     * @param {EncryptedConnection} targetUser The EncryptedConnection to which this packet will be sent. This is required for encrypting the AES key.
     * @param {NodeRSA} serverPriv The server's generated private key. This is required for generating the signature.
     * @returns {string} The three parts of the packet, concatenated with {@link PACKET_SEPARATOR}
     */
    export function composePacket(content: string, targetUser: EncryptedConnection, serverPriv: any): string {
        // the order, specified in protocol.md, is: encrypted message, encrypted key, signature
        let aesKey = Crypto.randomBytes(AES_KEY_SIZE);
        let encryptedMessage: Buffer = aesEncrypt(content, aesKey);
        let encryptedKey: Buffer = targetUser.publicKey.encrypt(aesKey, 'buffer', 'buffer');
        let signature: Buffer = serverPriv.sign(blakeHash(Buffer.from(content)), 'buffer', 'buffer');
        return [encryptedMessage, encryptedKey, signature].map(val => val.toString('base64')).join(PACKET_SEPARATOR);
    }

    /**
     * Parses the received packet, splitting it into three parts and following the procedure at protocol.md#server-msg-from-client.
     * 
     * @export
     * @param {string} contents
     * @param {EncryptedConnection} sender
     * @param {*} serverPriv
     * @returns {Array} The decrypted message and whether or not the signature is valid.
     */
    export function parsePacket(contents: string, sender: EncryptedConnection, serverPriv: any): [string, boolean] {
        let [encryptedMessage, encryptedKey, signature] = contents.split(PACKET_SEPARATOR);
        let aesKey: Buffer = serverPriv.decrypt(encryptedKey, 'buffer');
        let clearMessage = aesDecrypt(Buffer.from(encryptedMessage, 'base64'), aesKey);
        let signatureValid = sender.publicKey.verify(blakeHash(Buffer.from(clearMessage)), signature, 'buffer', 'base64');
        return [clearMessage, signatureValid];
    }
}