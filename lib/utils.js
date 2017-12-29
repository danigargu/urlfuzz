'use strict';

const path = require('path');

// Lodash as base.
const utils = require('lodash');
const debug = require('debug');

const { name } = require('../package.json');


// To follow the convention: https://github.com/visionmedia/debug#conventions
utils.dbg = (tag) => debug(`${name}:${tag}`);


module.exports = utils;
