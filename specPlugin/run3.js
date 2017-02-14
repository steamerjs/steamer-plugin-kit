'use strict';

var robot = require("robotjs"),
	KIT = require('../index'),
	spawnSync = require('child_process').spawnSync,
	Promise = require('bluebird'),
	fs = require('fs-extra');

process.chdir('./specPlugin/steamer-react-hy1');

fs.removeSync('backup');

var kit = new KIT({
    update: '@tencent/react-hy'
});

kit.init();