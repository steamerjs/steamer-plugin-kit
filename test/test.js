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
	  SteamerKit = require('../index');

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



describe('list, help', function() {

    it('list', function() {
        let kit = new SteamerKit({
            list: true
        });

        let logStub = sinon.stub(kit, 'log');
        let successStub = sinon.stub(kit, 'success');
        kit.kitOptions.list = {
            'steamer-react': {
                currentVersion: '1.0.0',
                description: 'steamer-react',
                url: 'https://github.com/steamerjs/steamer-react.git'
            }
        };

        kit.init();

        expect(logStub.calledWith('You can use following starterkits: ')).to.eql(true);
        expect(successStub.calledWith(kit.chalk.bold(`* steamer-react`))).to.eql(true);
        expect(logStub.calledWith(`    - ver: 1.0.0`)).to.eql(true);
        expect(logStub.calledWith(`    - des: steamer-react`)).to.eql(true);
        expect(logStub.calledWith(`    - url: https://github.com/steamerjs/steamer-react.git`)).to.eql(true);
        // expect(logStub.calledOnce).to.eql(true);

        logStub.restore();
    });

    it('help', function() {
        let kit = new SteamerKit({
            help: true
        });

        let printUsageStub = sinon.stub(kit, 'printUsage');

        kit.help();

        expect(printUsageStub.calledWith('manage starterkits', 'kit')).to.eql(true);
        expect(printUsageStub.calledOnce).to.eql(true);

        printUsageStub.restore();
    });
});