// Copyright (c) 2017 LiquidOxygen
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// File description: Filesystem utilities
// This file is used by account.ts and message.ts.

/// <reference path="typings/index.d.ts" />
/// <reference path="encrypt.ts" />
import { Crypt } from './encrypt';
import * as fs from 'fs';
import { Logger } from './logging';

export class BasicFile {
    uri: string;
    map: Object;

    constructor(location: string) {
        if (!fs.existsSync(location)) {
            fs.writeFileSync(location, '{}');
        }
    }

    write() {
        fs.writeFileSync(this.uri, JSON.stringify(this.map));
    }

    read(): Object {
        Logger.into(`[${this}].read`);
        try {
            this.map = JSON.parse(fs.readFileSync(this.uri, 'utf8'));
        } catch (e) {
            Logger.fail(e, 'Corrupt JSON in LocalFile');
        } finally {
            Logger.outOf();
        }
        return this.map;
    }

    toString() {
        return `LocalFile<uri=${JSON.stringify(this.uri)}>`;
    }
}