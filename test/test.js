"use strict";

const path = require('path'),
	  os = require('os'),
	  fs = require('fs-extra'),
	  chalk = require('chalk'),
	  expect = require('expect.js'),
	  sinon = require('sinon'),
	  compareVersions = require('compare-versions'),
	  cp = require('child_process'),
	  spawnSync = cp.spawnSync,
	  plugin = require('../index');

var nodeVer = process.version.replace('V', '').replace('v', ''),
	isNode8 = compareVersions(nodeVer, '8.0.0') > -1;

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

function trimString(str) {
    return str.replace(/(\r\n|\n|\r)/gm,"");
}

beforeEach(function() {
	process.chdir(PROJECT);
});

after(function() {
	fs.removeSync(path.join(KIT, 'steamer-example1/package-lock.json'));
	fs.removeSync(path.join(KIT, 'steamer-example2/package-lock.json'));
	fs.removeSync(path.join(KIT, 'steamer-example3/package-lock.json'));
	fs.removeSync(path.join(KIT, 'steamer-example4/package-lock.json'));
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

	});

	it("starter kit install normal kit", function(done) {
		this.timeout(10000);

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

			if (isNode8) {
				expect(folderInfo).to.eql([ 
					'.eslintrc.js',
					'.steamer',
				  	'.stylelintrc.js',
				  	'README.md',
				  	'config',
				  	'package-lock.json',
				  	'package.json',
				  	'src',
				  	'tools' ]
				);
			}
			else {
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
			}

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

			if (isNode8) {
				expect(folderInfo).to.eql([ 
					'.eslintrc.js',
					'.steamer',
				  	'.stylelintrc.js',
				  	'README.md',
				  	'config',
				  	'package-lock.json',
				  	'package.json',
				  	'src',
				  	'tools' ]
				);
			}
			else {
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
			}

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

			if (isNode8) {
				expect(folderInfo).to.eql([ 
					'.eslintrc.js',
					'.steamer',
				  	'.stylelintrc.js',
				  	'README.md',
				  	'config',
				  	'package-lock.json',
				  	'package.json',
				  	'src',
				  	'tools' ]
				);
			}
			else {
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
			}	

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

describe("install template", function() {
	
	this.timeout(10000);

	it("install template", function(done) {

		this.timeout(10000);

		process.chdir("./steamer-example1");

		var kit = new plugin({
			t: true,
		});
		kit.init();

		userInput("data", "\n", 1);
		userInput("data", "\n", 2);
		userInput("data", "npm\n", 3);
		userInput("data", "\n", 4);
		userInput("data", "detail\n", 5);

		userInputEnd(function() {
			let folderInfo = fs.readdirSync(path.resolve("src/page/detail"));
			expect(folderInfo).to.eql([
				'index.css',
				'index.html',
				'index.js'
			]);

			let jsResultContent = trimString(fs.readFileSync(path.join(KIT, "result/template/detail.js"), "utf-8")),
				jsContent = trimString(fs.readFileSync(path.resolve("src/page/detail/index.js"), "utf-8"));

			expect(jsResultContent).to.eql(jsContent);

			let htmlResultContent = trimString(fs.readFileSync(path.join(KIT, "result/template/detail.html"), "utf-8")),
				htmlContent = trimString(fs.readFileSync(path.resolve("src/page/detail/index.html"), "utf-8"));

			expect(htmlResultContent).to.eql(htmlContent);

			done();
		}, 6);

	});

	it("install template with template config", function(done) {

		this.timeout(10000);

		process.chdir("./steamer-example1");

		var kit = new plugin({
			template: true,
		});
		kit.init();

		userInput("data", "\n", 1);
		userInput("data", "comment\n", 2);

		userInputEnd(function() {
			let folderInfo = fs.readdirSync(path.resolve("src/page/comment"));
			expect(folderInfo).to.eql([
				'index.css',
				'index.html',
				'index.js'
			]);

			let jsResultContent = trimString(fs.readFileSync(path.join(KIT, "result/template/comment.js"), "utf-8")),
				jsContent = trimString(fs.readFileSync(path.resolve("src/page/comment/index.js"), "utf-8"));

			expect(jsResultContent).to.eql(jsContent);

			let htmlResultContent = trimString(fs.readFileSync(path.join(KIT, "result/template/comment.html"), "utf-8")),
				htmlContent = trimString(fs.readFileSync(path.resolve("src/page/comment/index.html"), "utf-8"));

			expect(htmlResultContent).to.eql(htmlContent);

			done();
		}, 3);

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

		fs.ensureDirSync(path.join(project, 'node_modules'));

		let folderInfo = fs.readdirSync(project),
			bkInfo = fs.readdirSync(bk),
			bkFolderInfo = fs.readdirSync(path.join(bk, bkInfo[0]));

		if (isNode8) {
			expect(folderInfo).to.eql([ 
				'.eslintrc.js',
			  	'.steamer',
			  	'.stylelintrc.js',
			  	'README.md',
			  	'backup',
			  	'config',
			  	'node_modules',
			  	'package-lock.json',
			  	'package.json',
			  	'src',
			  	'tools' 
			]);
		}
		else {
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
		}
		
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

		if (isNode8) {
			expect(folderInfo).to.eql([ 
				'.eslintrc.js',
			  	'.steamer',
			  	'.stylelintrc.js',
			  	'README.md',
			  	'backup',
			  	'config',
			  	'package-lock.json',
			  	'package.json',
			  	'src',
			  	'tools' 
			]);
		}
		else {
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
		}
		
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

		if (isNode8) {
			expect(folderInfo).to.eql([ 
				'.eslintrc.js',
			  	'.steamer',
			  	'.stylelintrc.js',
			  	'README.md',
			  	'backup',
			  	'config',
			  	'package-lock.json',
			  	'package.json',
			  	'src',
			  	'tools' 
			]);
		}
		else {
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
		}
		
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

describe("help", function() {
	
	it("help", function() {
		var kit = new plugin({});

		kit.help();
	});

});