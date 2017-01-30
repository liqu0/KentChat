// Copyright (c) 2017 LiquidOxygen
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

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
     * @type {string}
     * @memberOf EncryptedConnection
     */
    public publicKey: string;
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
     * @param {string} serverPriv The server's generated private key. This is required for generating the signature.
     * @returns {string} The three parts of the packet, concatenated with {@link PACKET_SEPARATOR}
     */
    export function composePacket(content: string, targetUser: EncryptedConnection, serverPriv: string): string {
        // the order, specified in protocol.md, is: encrypted message, encrypted key, signature
        let aesKey = Crypto.randomBytes(AES_KEY_SIZE);
        let encryptedMessage: Buffer = aesEncrypt(content, aesKey);
        let encryptedKey: Buffer = Crypto.publicEncrypt(targetUser.publicKey, aesKey);
        //let signature: Buffer = serverPriv.sign(blakeHash(Buffer.from(content)), 'buffer', 'buffer');
        let signer = Crypto.createSign('RSA-SHA256');
        signer.update(content);
        let signature = signer.sign(serverPriv);
        return [encryptedMessage, encryptedKey, signature].map(val => val.toString('base64')).join(PACKET_SEPARATOR);
    }

    /**
     * Parses the received packet, splitting it into three parts and following the procedure at protocol.md#server-msg-from-client.
     * 
     * @export
     * @param {string} contents The contents of the packet; Should be 3 base64 strings joined by `PACKET_SEPARATOR`.
     * @param {EncryptedConnection} sender The original sender of the packet. Needed for signature verification.
     * @param {string} serverPriv The private key of the server. Needed for AES key decryption.
     * @returns {Array} The decrypted message and whether or not the signature is valid.
     */
    export function parsePacket(contents: string, sender: EncryptedConnection, serverPriv: string): [string, boolean] {
        let [encryptedMessage, encryptedKey, signature]: Buffer[] = contents.split(PACKET_SEPARATOR).map(part => Buffer.from(part, 'base64'));
        let aesKey = Crypto.privateDecrypt(serverPriv, encryptedKey);
        let clearMessage = aesDecrypt(encryptedMessage, aesKey);
        let verifier = Crypto.createVerify('RSA-SHA256');
        verifier.update(clearMessage);
        let signatureValid = verifier.verify(sender.publicKey, signature);
        return [clearMessage, signatureValid];
    }
}