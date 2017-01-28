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

// File description: Type declaration of the [blake2js](https://www.npmjs.com/package/blake2js) NPM package

declare module 'blake2js' {
    export type Blake2Algorithm = 'blake2s'|'blake2sp'|'blake2b'|'blake2bp';

    export function hash(algorithm: Blake2Algorithm,
                         data: Object|Buffer|string,
                         option?: Object,
                         encoding?: string): Buffer|string;
}