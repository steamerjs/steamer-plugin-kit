'use strict';

var robot = require("robotjs"),
	KIT = require('../index'),
	spawnSync = require('child_process').spawnSync,
	Promise = require('bluebird'),
	fs = require('fs-extra');

new Promise((resolve, reject) => {
	// change directory
	process.chdir('./specPlugin');

	fs.removeSync('steamer-react-hy');

	var kit = new KIT({
	    install: "@tencent/react-hy"
	});

	kit.init();

	robot.typeString("//localhost:9001/");
	robot.keyTap("enter");

	setTimeout(() => {
		robot.typeString("//localhost:8001/");
		robot.keyTap("enter");
	}, 100);

	setTimeout(() => {
		robot.typeString(9001);
		robot.keyTap("enter");
	}, 300);

	setTimeout(() => {
		robot.typeString("/news/");
		robot.keyTap("enter");
	}, 500);

	setTimeout(() => {
		resolve();
	}, 1000);

}).then(() => {
	process.chdir('./steamer-react-hy');

	var kit = new KIT({
	    update: true
	});

	kit.init();
	
});