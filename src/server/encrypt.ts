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
import * as Crypto from 'crypto';
import * as Blake2 from 'blake2';

export namespace crypt {

    // --- Utility functions ---

    /**
     * Encrypts the given message (in utf8) with AES-256 using the given key.
     * 
     * Simplifies the [...].update, [...].final process.
     */
    function aesEncrypt(message: string, key: Buffer): Buffer {
        let cipher = Crypto.createCipher('aes256', key);
        cipher.update(message, 'utf8');
        return cipher.final();
    }

    /**
     * Decrypts the given message with AES-256 using the given key, then encodes the result in utf8.
     * 
     * Simplifies the [...].update, [...].final process.
     */
    function aesDecrypt(data: Buffer, key: Buffer): string {
        let decipher = Crypto.createDecipher('aes256', key);
        decipher.update(data);
        return decipher.final('utf8');
    }

    /**
     * Hashes the given Buffer using [BLAKE2](https://blake2.net).
     * 
     * Can optionally specify the sub-algorithm of BLAKE2 to use for the hashing.
     * 'Algorithm to use can either be "blake2s", "blake2sp", "blake2b" or "blake2bp".'
     */
    function blakeHash(data: Buffer, algorithm: string = 'blake2b'): Buffer {

    }
}