'use strict';

var robot = require("robotjs"),
	KIT = require('../index'),
	spawnSync = require('child_process').spawnSync,
	Promise = require('bluebird'),
	fs = require('fs-extra');

new Promise((resolve, reject) => {
	// change directory
	process.chdir('./specPlugin');

	fs.removeSync('steamer-example');

	var kit = new KIT({
	    install: "example"
	});

	kit.init();

	robot.keyTap("enter");

	setTimeout(() => {
		robot.keyTap("enter");
	}, 100);

	setTimeout(() => {
		robot.keyTap("enter");
	}, 200);

	setTimeout(() => {
		robot.keyTap("enter");
	}, 300);

	setTimeout(() => {
		resolve();
	}, 400);

}).then(() => {
	// change directory
	
	process.chdir('./steamer-example');

	var kit = new KIT({
	    update: true
	});

	kit.init();
	
});