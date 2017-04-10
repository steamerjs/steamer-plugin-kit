"use strict";

const path = require('path'),
	  os = require('os'),
	  fs = require('fs-extra'),
	  chalk = require('chalk'),
	  expect = require('expect.js'),
	  sinon = require('sinon'),
	  spawnSync = require('child_process').spawnSync,
	  plugin = require('../index');

const TEST = "test",
	  PROJECT = path.join(process.cwd(), TEST, "project"),
	  KIT = path.join(process.cwd(), TEST, "kit");

function linkKit(kitName, cmd) {
	process.chdir(KIT);
	process.chdir(kitName);
	spawnSync("npm", [cmd], {stdio: "inherit"});
}

function userInput(key, val, order) {
	setTimeout(function () {
		process.stdin.emit(key, val);
	}, order * 200);
}

function userInputEnd(cb, order) {
	setTimeout(function () {
		cb();
	}, order * 200);
}


beforeEach(function() {
	process.chdir(PROJECT);
});

describe("install", function() {

	this.timeout(10000);

	before(function() {
		fs.emptyDirSync(PROJECT);

		linkKit("steamer-example1", "link");
		linkKit("steamer-example2", "link");
	});

	it("list available starter kits", function() {
		this.timeout(2400);

		var kit = new plugin({
			list: true,
		});

		var infoStub = sinon.stub(kit.utils, "info");

		kit.init();

		expect(infoStub.calledWith("example1")).to.be(true);
		expect(infoStub.calledWith("@tencent/example2")).to.be(true);

		infoStub.restore();
	});

	it("auto install", function(done) {
		this.timeout(10000);

		var kit = new plugin({});

		var listStub = sinon.stub(kit, "listKit").callsFake(function() {
			return [
				"example1",
				"@tencent/example2",
			];
		});

		kit.init();

		var initStub = sinon.stub(kit, "init");

		userInput("data", "\n", 1);
		userInput("data", "auto\n", 2);

		userInputEnd(function() {

			expect(initStub.calledWith({
				install: "example1",
				path: "auto",
			})).to.be(true);

			initStub.restore();
			listStub.restore();

			done();
		}, 3);
		// userInput("data", "//localhost:9001/\n", 1);
		// userInput("data", "//localhost:8001/\n", 2);
		// userInput("data", "9001\n", 3);
		// userInput("data", "/home/\n", 4);
		// userInput("data", "npm\n", 5);
		

	});

	it("starter kit install normal kit", function(done) {
		this.timeout(10000);

		// let ps = spawn("steamer", ["kit", "--install", "example1"], {
		// 	// stdio: 'inherit',
		// 	cwd: PROJECT
		// });

		// ps.stdout.pipe(process.stdout);

		// setTimeout(() => {
		// 	ps.stdin.write("\n");
		// }, 200);
		
		// setTimeout(() => {
		// 	ps.stdin.write("\n");
		// }, 400);

		// setTimeout(() => {
		// 	ps.stdin.write("\n");
		// }, 600);

		// setTimeout(() => {
		// 	ps.stdin.write("\n");
		// }, 800);

		// setTimeout(() => {
		// 	ps.stdin.write("\n");
		// }, 1000);

		// setTimeout(() => {
		// 	ps.stdin.write("\n");
		// }, 1200);

		// setTimeout(() => {
		// 	ps.stdin.end();
		// }, 1400);

		// ps.on('error', function(err) {
		//     console.log(err);
		//     done();
		// });

		// ps.on('exit', function (err) {
		//     console.log('exit');
		//     done();
		// });

		var kit = new plugin({
			install: 'example1',
		});
		kit.init();

		userInput("data", "//localhost:9001/\n", 1);
		userInput("data", "//localhost:8001/\n", 2);
		userInput("data", "9001\n", 3);
		userInput("data", "/home/\n", 4);
		userInput("data", "npm\n", 5);
		userInput("data", "\n", 6);

		userInputEnd(function(){
			let project = path.join(PROJECT, "steamer-example1");

			let folderInfo = fs.readdirSync(project);
			expect(folderInfo).to.eql([ 
				'.eslintrc.js',
				'.steamer',
			  	'.stylelintrc.js',
			  	'README.md',
			  	'config',
			  	'node_modules',
			  	'package.json',
			  	'src',
			  	'tools' ]
			);

			let steamerConfig = require(path.join(project, "config/steamer.config"));
			expect(steamerConfig).to.eql({
				"webserver": "//localhost:9001/",
			    "cdn": "//localhost:8001/",
			    "port": "9001",
			    "route": "/home/"
			});
			done();
		}, 7);

	});

	it("starter kit install same normal kit", function() {
		this.timeout(2400);

		var kit = new plugin({
			install: 'example1',
		});

		expect(function() {

			kit.init();

		}).to.throwError();

	});

	it("starter kit install scoped kit", function(done) {
		this.timeout(10000);

		var kit = new plugin({
			install: '@tencent/example2',
		});
		kit.init();

		userInput("data", "//localhost:9001/\n", 1);
		userInput("data", "//localhost:8001/\n", 2);
		userInput("data", "9001\n", 3);
		userInput("data", "/home/\n", 4);
		userInput("data", "npm\n", 5);
		userInput("data", "\n", 6);

		userInputEnd(function() {
			let project = path.join(PROJECT, "steamer-example2");

			let folderInfo = fs.readdirSync(project);

			expect(folderInfo).to.eql([ 
				'.eslintrc.js',
				'.steamer',
			  	'.stylelintrc.js',
			  	'README.md',
			  	'config',
			  	'node_modules',
			  	'package.json',
			  	'src',
			  	'tools' ]
			);

			let steamerConfig = require(path.join(project, "config/steamer.config"));
			expect(steamerConfig).to.eql({
				"webserver": "//localhost:9001/",
			    "cdn": "//localhost:8001/",
			    "port": "9001",
			    "route": "/home/"
			});
			
			done();
		}, 7);

	});

	it("starter kit install not available kit", function(done) {
		this.timeout(600000);

		var kit = new plugin({
			install: 'example',
		});
		kit.init();

		userInput("data", "//localhost:9001/\n", 1);
		userInput("data", "//localhost:8001/\n", 2);
		userInput("data", "9001\n", 3);
		userInput("data", "/home/\n", 4);
		userInput("data", "npm\n", 5);
		userInput("data", "\n", 6);

		userInputEnd(function(){
			let project = path.join(PROJECT, "steamer-example");

			let folderInfo = fs.readdirSync(project);
			expect(folderInfo).to.eql([ 
				'.eslintrc.js',
				'.steamer',
			  	'.stylelintrc.js',
			  	'README.md',
			  	'config',
			  	'node_modules',
			  	'package.json',
			  	'src',
			  	'tools' ]
			);

			let steamerConfig = require(path.join(project, "config/steamer.config"));
			expect(steamerConfig).to.eql({
				"webserver": "//localhost:9001/",
			    "cdn": "//localhost:8001/",
			    "port": "9001",
			    "route": "/home/"
			});
			done();
		}, 7);


	});

	after(function() {
		spawnSync("npm", ["uninstall", "-g", "steamer-example"], { stdio: 'inherit' });
	});


});

describe("update", function() {

	this.timeout(10000);

	before(function() {

		linkKit("steamer-example1", "unlink");
		linkKit("steamer-example2", "unlink");

		linkKit("steamer-example3", "link");
		linkKit("steamer-example4", "link");

	});

	it("update starterkit without .steamer/steamer-plugin-kit.js", function() {
		let kitProject = path.join(KIT, "steamer-example1"),
			project = path.join(PROJECT, "steamer-example5"),
			bk = path.join(project, "backup");

		fs.copySync(kitProject, path.join(PROJECT, "steamer-example5"));

		process.chdir("steamer-example5");

		var kit = new plugin({
			update: "example1",
		});
		kit.init();

		let folderInfo = fs.readdirSync(project),
			bkInfo = fs.readdirSync(bk),
			bkFolderInfo = fs.readdirSync(path.join(bk, bkInfo[0]));

		expect(folderInfo).to.eql([ 
			'.eslintrc.js',
		  	'.steamer',
		  	'.stylelintrc.js',
		  	'README.md',
		  	'backup',
		  	'config',
		  	'node_modules',
		  	'package.json',
		  	'src',
		  	'tools' 
		]);
		
		expect(bkFolderInfo).to.eql([ 
			'.eslintrc.js',
  			'.stylelintrc.js',
  			'README.md',
  			'config',
  			'package.json',
  			'tools' 
  		]);

		let config = JSON.parse(fs.readFileSync(path.join(project, "package.json"), "utf-8"));

		expect(config.version).to.be("3.0.0");

	});

	it("normal starter kit update", function() {

		let project = path.join(PROJECT, "steamer-example1"),
			bk = path.join(project, "backup");

		process.chdir("steamer-example1");

		var kit = new plugin({
			update: true,
		});
		kit.init();

		let folderInfo = fs.readdirSync(project),
			bkInfo = fs.readdirSync(bk),
			bkFolderInfo = fs.readdirSync(path.join(bk, bkInfo[0]));

		expect(folderInfo).to.eql([ 
			'.eslintrc.js',
		  	'.steamer',
		  	'.stylelintrc.js',
		  	'README.md',
		  	'backup',
		  	'config',
		  	'node_modules',
		  	'package.json',
		  	'src',
		  	'tools' 
		]);
		
		expect(bkFolderInfo).to.eql([ 
			'.eslintrc.js',
  			'.stylelintrc.js',
  			'README.md',
  			'config',
  			'package.json',
  			'tools' 
  		]);

		let config = JSON.parse(fs.readFileSync(path.join(project, "package.json"), "utf-8"));

		expect(config.version).to.be("3.0.0");
	});

	it("scoped starter kit update", function() {

		let project = path.join(PROJECT, "steamer-example2"),
			bk = path.join(project, "backup");

		process.chdir("steamer-example2");

		var kit = new plugin({
			update: true,
		});
		kit.init();

		let folderInfo = fs.readdirSync(project),
			bkInfo = fs.readdirSync(bk),
			bkFolderInfo = fs.readdirSync(path.join(bk, bkInfo[0]));

		expect(folderInfo).to.eql([ 
			'.eslintrc.js',
		  	'.steamer',
		  	'.stylelintrc.js',
		  	'README.md',
		  	'backup',
		  	'config',
		  	'node_modules',
		  	'package.json',
		  	'src',
		  	'tools' 
		]);
		
		expect(bkFolderInfo).to.eql([ 
			'.eslintrc.js',
  			'.stylelintrc.js',
  			'README.md',
  			'config',
  			'package.json',
  			'tools' 
  		]);

		let config = JSON.parse(fs.readFileSync(path.join(project, "package.json"), "utf-8"));

		expect(config.version).to.be("3.0.0");

	});

	after(function() {

		linkKit("steamer-example3", "unlink");
		linkKit("steamer-example4", "unlink");
	});

});