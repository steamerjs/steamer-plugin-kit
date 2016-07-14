"use strict";

const fs = require('fs'),
	  argv = require('yargs').argv,
	  exec = require('child_process').exec,
	  _ = require('lodash'),
	  path = require('path'),
	  Repo = require('steamer-core').Repo,
	  Err = require('steamer-core').Err,
	  Log = require('steamer-core').Log;

var cmdHypen = argv,
	cmdNonHypen = argv._;

module.exports = {
	init: function() {

		// remove kit
		cmdNonHypen.splice(0, 1);

		let action = cmdNonHypen.splice(0, 1)[0] || '';

		if (_.has(this, action)) {
			let pkg = cmdNonHypen.splice(0, 1)[0] || '',
				localPath = cmdNonHypen.splice(0, 1)[0] || '';
			
			this[action](pkg, localPath);
		}
		
	},
	install: function(pkg, localPath) {

		if (!_.has(Repo, pkg)) {
			Err.PkgNotFound(pkg);
			return;
		}

		let cmd = 'git clone --depth=1 ' + Repo[pkg].git + ' ' + localPath;
		Log.log(cmd);

		let childProcess = exec(cmd, function (error, stdout, stderr) {});

		childProcess.stdout.on('data', function (data) {
	    	Log.log(data);
	    });

	    childProcess.stderr.on('data', function (data) {
	    	Log.log(data);
	    });

	    childProcess.on('exit', (code) => {
	    	if (!code) {
	    		Log.log('clone ' + pkg + ' success');
	    	}
	    	else {
	    		Log.error('clone ' + pkg + ' error');
	    	}
	    });
	},
	repo: function() {
		// TODO update repo list
	}
};