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

export class LocalFile {
    uri: string;
    map: Object;

    writeToFile() {
        fs.writeFileSync(this.uri, JSON.stringify(this.map));
    }
}