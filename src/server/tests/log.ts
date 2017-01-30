// Copyright (c) 2017 LiquidOxygen
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

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