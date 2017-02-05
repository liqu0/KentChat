// Copyright (c) 2017 LiquidOxygen
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// File description: Account management of KentChat Server
/// <reference path="fs.ts" />
import { BasicFile, getKentChatPath } from './fs';

/*
 * accounts.json format:
 * {
 *   "ejRNqiwejREjrmaepqJelaA": {
 *     "username": "broadwell",
 *     "password": "1ClejEnrmqR21kj5nrM4ffIWjap==",
 *     "options": {
 *       "dm.formatText": true
 *     }
 *     // NOTE: more attributes?
 *   }
 * }
 */
let accountDb = new BasicFile(getKentChatPath('accounts.json'));

export class Account {

    /**
     * Registers a new account and stores it in the server's database.
     * 
     * @static
     * @param {string} name Username of the new account
     * @param {Buffer} passwd Password of the new account, SHA256'd once
     * @returns {boolean} True if succeeded, false if username exists
     * 
     * @memberOf Account
     */
    static register(name: string, passwd: Buffer): boolean {
        
    }

    // -----
    username: string;
    constructor(username: string) {

    }
}