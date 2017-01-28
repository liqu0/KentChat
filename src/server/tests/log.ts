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

// File description: Tester for logging.ts
// NOTE: This file cannot test automatically; Examine STDOUT for results.

/// <reference path="../logging.ts" />
import { Logger } from '../logging';

Logger.into('test-phase1');

Logger.log('info', 'Information0');
Logger.log('info', String(42));
Logger.log('info', '');
Logger.log('info', 'InformationEnd');

Logger.outOf();

Logger.into('test-phase2');

Logger.log('info', 'Information1', 'hand');
Logger.log('warn', 'Warning0', 'hand');
Logger.log('error', 'Error0', 'hand');
Logger.log('fatal', 'Fatal0', 'hand');

Logger.outOf();

Logger.log('warn', 'Expect outOf underflow next', 'face');
Logger.outOf();

try {
    throw new RangeError('Golf range too small');
} catch (error) {
    Logger.fail(error);
    Logger.log('info', '--split--');
    Logger.fail(error, 'Pre-description blah');
}