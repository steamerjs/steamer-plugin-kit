'use strict';

var robot = require("robotjs"),
	KIT = require('../index'),
	spawnSync = require('child_process').spawnSync,
	Promise = require('bluebird'),
	fs = require('fs-extra');

process.chdir('./specPlugin/steamer-example1');

fs.removeSync('backup');

var kit = new KIT({
    update: 'example'
});

kit.init();