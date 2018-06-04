"use strict";

const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const chalk = require('chalk');
const bluebird = require('bluebird');
const expect = require('expect.js');
const sinon = require('sinon');
const compareVersions = require('compare-versions');
const cp = require('child_process');
const spawnSync = cp.spawnSync;
const SteamerKit = require('../index');

var nodeVer = process.version.replace('V', '').replace('v', ''),
    isNode8 = compareVersions(nodeVer, '8.0.0') > -1;

const CUR_ENV = process.cwd();
const TEST = "test";
const PROJECT = path.join(process.cwd(), TEST, "project");
const KIT = path.join(process.cwd(), TEST, "kit");
const kitHomePath = path.join(process.cwd(), TEST, '.steamer/starterkits');
const kitOptionsPath = path.join(kitHomePath, 'starterkits.js');

function linkKit(kitName, cmd) {
    process.chdir(KIT);
    process.chdir(kitName);
    spawnSync("npm", [cmd], { stdio: "inherit" });
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
    return str.replace(/(\r\n|\n|\r)/gm, "");
}


before(function () {
    fs.removeSync(path.join(process.cwd(), TEST, '.steamer'));
});

describe('list, help', function () {

    it('list', function () {
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

    it('help', function () {
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

describe('add starterkit', function () {

    before(() => {
        fs.removeSync(path.join(process.cwd(), TEST, '.steamer'));
    });

    it('add startkit', function (cb) {
        let repoUrl = 'https://github.com/steamerjs/steamer-example1.git';
        let now = Date.now();
        let kit = new SteamerKit({
            add: repoUrl
        });
        kit.kitHomePath = kitHomePath;
        kit.kitOptionsPath = kitOptionsPath;
        let kitOptions = { list: {} };
        kitOptions.list['steamer-example1'] = {
            url: repoUrl,
            path: path.join(kitHomePath, 'steamer-example1'),
            versions: ['2.0.0'],
            description: 'steamer starter kit example"',
            currentVersion: '2.0.0',
            latestVersion: '2.0.0'
        };
        kitOptions.timestamp = now;

        let kitGetKitOptionsStub = sinon.stub(kit, "getKitOptions").callsFake(function () {
            if (!fs.existsSync(kitOptionsPath)) {
                fs.ensureFileSync(kitOptionsPath);
            }

            return kitOptions;
        });
        let kitStub = sinon.stub(kit, "clone").usingPromise(bluebird.Promise).resolves().callsFake(function () {
            return Promise.resolve();
        });

        kit.init();

        setTimeout(() => {
            expect(kit.getKitOptions()).to.eql(kitOptions);
            kitStub.restore();
            kitGetKitOptionsStub.restore();
            cb();
        }, 100);
    });

    it('add startkit - clone without tag', function () {
        let repoUrl = 'https://github.com/steamerjs/steamer-example1.git';
        let now = Date.now();
        let kit = new SteamerKit({
            add: repoUrl
        });
        kit.kitHomePath = kitHomePath;
        kit.kitOptionsPath = kitOptionsPath;
        let kitOptions = { list: {} };
        kit.writeKitOptions(kitOptions); // reset starterkit.js

        let kitCloneLatest = sinon.stub(kit, "cloneLatest").usingPromise(bluebird.Promise).resolves();

        kit.clone(repoUrl, null, null).then(() => {

        });

        expect(kitCloneLatest.args[0][0]).to.eql({
            repo: repoUrl,
            kitName: 'steamer-example1',
            localPath: path.join(kit.kitHomePath, 'steamer-example1'),
            tag: null
        });

        kitCloneLatest.restore();
    });

    it('add startkit - clone with tag', function () {
        let repoUrl = 'https://github.com/steamerjs/steamer-example1.git';
        let now = Date.now();
        let kit = new SteamerKit({
            add: repoUrl
        });
        kit.kitHomePath = kitHomePath;
        kit.kitOptionsPath = kitOptionsPath;
        let kitOptions = { list: {} };
        kit.writeKitOptions(kitOptions); // reset starterkit.js

        let kitCloneTag = sinon.stub(kit, "cloneTag").usingPromise(bluebird.Promise).resolves();

        kit.clone(repoUrl, '1.0.0', null).then(() => {

        });

        expect(kitCloneTag.args[0][0]).to.eql({
            repo: repoUrl,
            kitName: 'steamer-example1',
            localPath: path.join(kit.kitHomePath, 'steamer-example1'),
            tag: '1.0.0'
        });

        kitCloneTag.restore();
    });

    it('add startkit - cloneLatest', function () {
        let repoUrl = 'https://github.com/steamerjs/steamer-example1.git';
        let localPath = path.join(kitHomePath, 'steamer-example1');
        let now = Date.now();
        let kit = new SteamerKit({
            add: repoUrl
        });
        kit.kitHomePath = kitHomePath;
        kit.kitOptionsPath = kitOptionsPath;
        let kitOptions = { list: {} };
        kit.writeKitOptions(kitOptions); // reset starterkit.js
        kit.kitOptions = kit.getKitOptions(); // re-getKitOptions

        let kitSpinnerStub = sinon.stub(kit, 'spinner').callsFake(function () {
            return {};
        });

        let execTime = 0;
        let branchTime = 0;
        let kitGitStub = sinon.stub(kit, 'git').callsFake(function () {
            let fakeGit = {
                silent: (isSilent) => {
                    return fakeGit;
                },
                exec: (cb) => {
                    if (execTime > 0) {
                        cb && cb();
                    }

                    if (execTime === 1) {
                        kit.kitOptions.list['steamer-example1'].url = repoUrl;
                        kit.kitOptions.list['steamer-example1'].path = localPath;
                        expect(kit.kitOptions.list).to.eql({
                            'steamer-example1': {
                                url: repoUrl,
                                description: 'steamer starter kit example',
                                path: localPath,
                                currentVersion: '2.0.0',
                                latestVersion: '2.0.0',
                                versions: ['2.0.0']
                            }
                        });
                    }
                    execTime++;
                    return fakeGit;
                },
                clone: (repo, localPath, option, cb) => {
                    cb && cb(null);
                    fs.copySync(path.join(process.cwd(), TEST, 'kit/steamer-example1'), path.join(process.cwd(), TEST, '.steamer/starterkits/steamer-example1'));
                    return fakeGit;
                },
                branch: (versions, cb) => {
                    if (branchTime === 0) {
                        expect(versions).to.eql(['2.0.0']);
                    }
                    else if (branchTime === 1) {
                        expect(versions).to.eql(['-D', 'master']);
                    }
                    branchTime++;
                    return fakeGit;
                },
                checkout: (version, cb) => {
                    cb && cb();
                    return fakeGit;
                }
            };

            return fakeGit;
        });

        kit.cloneLatest({
            repo: repoUrl,
            kitName: 'steamer-example1',
            localPath: localPath,
        }).then(() => {
            kitGitStub.restore();
            kitSpinnerStub.restore();
        }).catch((e) => {
            console.log(e);
        });
    });

    it('add startkit - cloneTag', function () {
        let repoUrl = 'https://github.com/steamerjs/steamer-example2.git';
        let localPath = path.join(kitHomePath, 'steamer-example2');
        let now = Date.now();
        let kit = new SteamerKit({
            add: repoUrl
        });
        kit.kitHomePath = kitHomePath;
        kit.kitOptionsPath = kitOptionsPath;
        let kitOptions = { list: {} };
        kit.writeKitOptions(kitOptions); // reset starterkit.js
        kit.kitOptions = kit.getKitOptions(); // re-getKitOptions
        kit.kitOptions.list['steamer-example2'] = {
            url: repoUrl,
            path: localPath,
            versions: []
        };

        let kitSpinnerStub = sinon.stub(kit, 'spinner').callsFake(function () {
            return {};
        });

        let execTime = 0;
        let kitGitStub = sinon.stub(kit, 'git').callsFake(function (localPath) {
            let fakeGit = {
                silent: (isSilent) => {
                    return fakeGit;
                },
                exec: (cb) => {
                    if (execTime > 0) {
                        cb && cb();
                    }
                    execTime++;
                    return fakeGit;
                },
                fetch: (option, cb) => {
                    fs.copySync(path.join(process.cwd(), TEST, 'kit/steamer-example2'), path.join(process.cwd(), TEST, '.steamer/starterkits/steamer-example2'));
                    cb && cb(null);
                    return fakeGit;
                },
                branch: (versions, cb) => {
                    expect(versions).to.eql(['2.0.0', '2.0.0']);
                    return fakeGit;
                },
                checkout: (version, cb) => {
                    expect(version).to.eql('2.0.0');
                    cb && cb();

                    expect(kit.kitOptions.list).to.eql({
                        'steamer-example2': {
                            url: repoUrl,
                            path: localPath,
                            versions: ['2.0.0'],
                            description: 'steamer starter kit example',
                            currentVersion: '2.0.0',
                            latestVersion: '2.0.0'
                        }
                    });
                    return fakeGit;
                }
            };

            return fakeGit;
        });

        kit.cloneTag({
            repo: repoUrl,
            kitName: 'steamer-example2',
            localPath: localPath,
            tag: '2.0.0'
        }).then(() => {
            kitGitStub.restore();
            kitSpinnerStub.restore();
        }).catch((e) => {
            console.log(e);
        });
    });

});

describe('install starterkit', function () {
    before(() => {
        fs.removeSync(PROJECT);
        fs.ensureDirSync(PROJECT);
    });

    it('install', function (done) {
        this.timeout(10000);
        let repoUrl = 'https://github.com/steamerjs/steamer-example1.git';
        let kit = new SteamerKit({

        });
        kit.kitHomePath = kitHomePath;
        kit.kitOptionsPath = kitOptionsPath;
        let kitOptions = {
            list: {
                "steamer-example1": {
                    "url": repoUrl,
                    "path": path.join(process.cwd(), TEST, ".steamer/starterkits/steamer-example1"),
                    "versions": [
                        "2.0.0"
                    ],
                    "description": "steamer starter kit example\"",
                    "currentVersion": "2.0.0",
                    "latestVersion": "2.0.0"
                }
            }
        };
        kit.writeKitOptions(kitOptions); // reset starterkit.js
        kit.kitOptions = kitOptions;

        let kitGitStub = sinon.stub(kit, 'git').callsFake(function (localPath) {
            let fakeGit = {
                checkout: (version, cb) => {
                    expect(version).to.be('2.0.0');
                    cb && cb();
                    return fakeGit;
                }
            };

            return fakeGit;
        });

        kit.init();

        userInput('data', '\n', 1);
        userInput('data', '\n', 2);
        userInput('data', `./test/project/steamer-project1\n`, 3);
        userInput('data', 'steamer-project1\n', 4);
        userInput('data', '\n', 5);
        userInput('data', '\n', 6);
        userInput('data', '\n', 7);
        userInput('data', '\n', 8);
        userInput('data', '\n', 9);

        userInputEnd(() => {
            expect(fs.readdirSync(PROJECT)).to.eql(['steamer-project1']);
            kitGitStub.restore();
            // let folderInfo = fs.readdirSync(path.join(PROJECT, 'steamer-project1'));
            let pkg = kit.getPkgJson(path.join(PROJECT, 'steamer-project1'));
            // let pkg = require(path.join(PROJECT, 'steamer-project1/package.json'));
            expect(pkg.name).to.eql('steamer-project1');
            expect(pkg.scripts.test).to.eql('jest');


            done();
        }, 10);
    });
});

describe('update', function () {
    it('update global starterkit - update options', function (done) {
        this.timeout(10000);
        let repoUrl = 'https://github.com/steamerjs/steamer-example1.git';
        let kit = new SteamerKit({
            update: 'steamer-example1',
            global: true,
        });
        kit.kitHomePath = kitHomePath;
        kit.kitOptionsPath = kitOptionsPath;
        let kitOptions = {
            list: {
                "steamer-example1": {
                    "url": repoUrl,
                    "path": path.join(process.cwd(), TEST, ".steamer/starterkits/steamer-example1"),
                    "versions": [
                        "2.0.0"
                    ],
                    "description": "steamer starter kit example\"",
                    "currentVersion": "2.0.0",
                    "latestVersion": "2.0.0"
                }
            }
        };
        kit.writeKitOptions(kitOptions); // reset starterkit.js
        kit.kitOptions = kitOptions;

        let kitUpdateGlobalKitStub = sinon.stub(kit, 'updateGlobalKit').usingPromise(bluebird.Promise).resolves({ kitName: 'steamer-example1', newVer: '2.0.1' });
        let kitWriteKitOptionsStub = sinon.stub(kit, 'writeKitOptions').callsFake(function (options) {
            let kitOption = kitOptions.list['steamer-example1'];
            let resultKitOption = options.list['steamer-example1'];
            expect(kitOption).to.eql(resultKitOption);
        });

        kit.init();

        userInput('data', '\n', 1);
        userInputEnd(() => {
            kitUpdateGlobalKitStub.restore();
            kitWriteKitOptionsStub.restore();
            done();
        }, 2);
    });

    it('update global starterkit - update global kit', function (done) {
        this.timeout(10000);
        let repoUrl = 'https://github.com/steamerjs/steamer-example1.git';
        let kit = new SteamerKit({
            update: 'steamer-example3',
            global: true,
        });
        kit.kitHomePath = kitHomePath;
        kit.kitOptionsPath = kitOptionsPath;
        let kitOptions = {
            list: {
                "steamer-example3": {
                    "url": repoUrl,
                    "path": path.join(process.cwd(), TEST, ".steamer/starterkits/steamer-example3"),
                    "versions": [
                        "2.0.0"
                    ],
                    "description": "steamer starter kit example\"",
                    "currentVersion": "2.0.0",
                    "latestVersion": "2.0.0"
                }
            }
        };
        kit.writeKitOptions(kitOptions); // reset starterkit.js
        kit.kitOptions = kitOptions;
        // create a new starterkit first
        fs.copySync(path.join(process.cwd(), TEST, 'kit/steamer-example1'), path.join(process.cwd(), TEST, '.steamer/starterkits/steamer-example3'));

        let execTime = 0;
        let checkoutTime = 0;
        let kitGitStub = sinon.stub(kit, 'git').callsFake(function (localPath) {
            let fakeGit = {
                silent: (isSilent) => {
                    return fakeGit;
                },
                exec: (cb) => {
                    if (execTime > 0) {
                        cb && cb();
                    }
                    execTime++;
                    return fakeGit;
                },
                fetch: (option, cb) => {
                    fs.copySync(path.join(process.cwd(), TEST, 'kit/steamer-example3'), path.join(process.cwd(), TEST, '.steamer/starterkits/steamer-example3'));
                    expect(option).to.eql(['origin', 'master:master']);
                    cb && cb(null);
                    return fakeGit;
                },
                branch: (versions, cb) => {
                    // expect(versions).to.eql([ '2.0.0', '2.0.0' ]);
                    cb && cb();
                    return fakeGit;
                },
                checkout: (version, cb) => {
                    if (checkoutTime === 0) {
                        expect(version).to.eql('master');
                    }
                    else if (checkoutTime === 1) {
                        expect(version).to.eql('3.0.0');
                    }
                    cb && cb();

                    checkoutTime++;
                    return fakeGit;
                }
            };

            return fakeGit;
        });

        kit.updateGlobalKit('steamer-example3')
            .then((result) => {
                expect(result).to.eql({ kitName: 'steamer-example3', newVer: '3.0.0' });
                let pkg = require(path.join(process.cwd(), TEST, '.steamer/starterkits/steamer-example3/package.json'));
                expect(pkg.version).to.be('3.0.0');
                kitGitStub.restore();
                done();
            }).catch((e) => {
                console.log(e);
                kitGitStub.restore();
                done();
            });
    });

    it('update global starterkit - update global kit with same version', function (done) {
        this.timeout(10000);
        let repoUrl = 'https://github.com/steamerjs/steamer-example1.git';
        let kit = new SteamerKit({
            update: 'steamer-example4',
            global: true,
        });
        kit.kitHomePath = kitHomePath;
        kit.kitOptionsPath = kitOptionsPath;
        let kitOptions = {
            list: {
                "steamer-example4": {
                    "url": repoUrl,
                    "path": path.join(process.cwd(), TEST, ".steamer/starterkits/steamer-example4"),
                    "versions": [
                        "2.0.0"
                    ],
                    "description": "steamer starter kit example\"",
                    "currentVersion": "2.0.0",
                    "latestVersion": "2.0.0"
                }
            }
        };
        kit.writeKitOptions(kitOptions); // reset starterkit.js
        kit.kitOptions = kitOptions;
        // create a new starterkit first
        fs.copySync(path.join(process.cwd(), TEST, 'kit/steamer-example3'), path.join(process.cwd(), TEST, '.steamer/starterkits/steamer-example4'));

        let execTime = 0;
        let checkoutTime = 0;
        let kitGitStub = sinon.stub(kit, 'git').callsFake(function (localPath) {
            let fakeGit = {
                silent: (isSilent) => {
                    return fakeGit;
                },
                exec: (cb) => {
                    if (execTime > 0) {
                        cb && cb();
                    }
                    execTime++;
                    return fakeGit;
                },
                fetch: (option, cb) => {
                    fs.copySync(path.join(process.cwd(), TEST, 'kit/steamer-example3'), path.join(process.cwd(), TEST, '.steamer/starterkits/steamer-example4'));
                    expect(option).to.eql(['origin', 'master:master']);
                    cb && cb(null);
                    return fakeGit;
                },
                branch: (versions, cb) => {
                    cb && cb();
                    return fakeGit;
                },
                checkout: (version, cb) => {
                    if (checkoutTime === 0) {
                        expect(version).to.eql('master');
                    }
                    else if (checkoutTime === 1) {
                        expect(version).to.eql('3.0.0');
                    }
                    cb && cb();

                    checkoutTime++;
                    return fakeGit;
                }
            };

            return fakeGit;
        });

        kit.updateGlobalKit('steamer-example4')
            .then((result) => {
                expect(result).to.eql({ kitName: 'steamer-example4', newVer: '3.0.0' });
                let pkg = require(path.join(process.cwd(), TEST, '.steamer/starterkits/steamer-example4/package.json'));
                expect(pkg.version).to.be('3.0.0');
                kitGitStub.restore();
                done();
            }).catch((e) => {
                console.log(e);
                done();
            });
    });

    it('update local starterkit', function (done) {
        this.timeout(10000);

        let repoUrl = 'https://github.com/steamerjs/steamer-example1.git';
        let kit = new SteamerKit({
            update: 'steamer-example1'
        });
        kit.kitHomePath = kitHomePath;
        kit.kitOptionsPath = kitOptionsPath;
        let kitOptions = {
            list: {
                "steamer-example1": {
                    "url": repoUrl,
                    "path": path.join(process.cwd(), TEST, ".steamer/starterkits/steamer-example1"),
                    "versions": [
                        "3.0.0"
                    ],
                    "description": "steamer starter kit example\"",
                    "currentVersion": "3.0.0",
                    "latestVersion": "3.0.0"
                }
            }
        };
        kit.writeKitOptions(kitOptions); // reset starterkit.js
        kit.kitOptions = kitOptions;
        // update global starterkit
        fs.copySync(path.join(process.cwd(), TEST, 'kit/steamer-example3'), path.join(process.cwd(), TEST, '.steamer/starterkits/steamer-example1'));
        fs.copySync(path.join(process.cwd(), TEST, 'kit/steamer-example1'), path.join(PROJECT, 'steamer-project2'));
        process.chdir(path.join(PROJECT, 'steamer-project2'));

        let kitGitStub = sinon.stub(kit, 'git').callsFake(function (localPath) {
            let fakeGit = {
                silent: (isSilent) => {
                    return fakeGit;
                },
                checkout: (version, cb) => {
                    cb && cb();
                    process.chdir(CUR_ENV);
                    done();
                    let pkg = require(path.join(PROJECT, 'steamer-project2/package.json'));
                    expect(version).to.be(pkg.version);
                    return fakeGit;
                }
            };

            return fakeGit;
        });

        kit.updateLocal();
    });
});

describe('remove', function () {
    it('remove kit', function () {
        let repoUrl = 'https://github.com/steamerjs/steamer-example5.git';
        let kit = new SteamerKit({
            remove: 'steamer-example5'
        });
        kit.kitHomePath = kitHomePath;
        kit.kitOptionsPath = kitOptionsPath;
        let kitOptions = {
            list: {
                "steamer-example5": {
                    "url": repoUrl,
                    "path": path.join(process.cwd(), TEST, ".steamer/starterkits/steamer-example5"),
                    "versions": [
                        "2.0.0"
                    ],
                    "description": "steamer starter kit example\"",
                    "currentVersion": "2.0.0",
                    "latestVersion": "2.0.0"
                }
            }
        };
        kit.writeKitOptions(kitOptions); // reset starterkit.js
        kit.kitOptions = kitOptions;

        let kitPath = path.join(process.cwd(), TEST, '.steamer/starterkits/steamer-example5');
        // update global starterkit
        fs.copySync(path.join(process.cwd(), TEST, 'kit/steamer-example1'), kitPath);

        expect(fs.existsSync(kitPath)).to.be(true);
        kit.init();
        expect(fs.existsSync(kitPath)).to.be(false);
    });
});

describe('util', function () {
    it('checkEmpty', function () {
        let kit = new SteamerKit({

        });

        expect(kit.checkEmpty(process.cwd())).to.be(false);
        expect(kit.checkEmpty(path.join(PROJECT, 'steamer-project'))).to.be(true);
    });

    it('getNameSpace', function () {
        let kit = new SteamerKit({

        });

        expect(kit.getNameSpace('https://github.com/steamerjs/steamer-react.git')).to.be(kit.getNameSpace('git@github.com:steamerjs/steamer-react.git'));
    });

    it('getKitOptions', function () {
        let now = Date.now();
        let kit = new SteamerKit({

        });
        kit.kitOptionsPath = path.join(process.cwd(), TEST, '.steamer/config.js');
        let options = kit.getKitOptions();
        options.timestamp = now;
        expect(options).to.eql({
            list: {},
            timestamp: now
        });
    });
});

describe("install template", function () {

    let project3 = path.join(PROJECT, 'steamer-project3');

    before(() => {
        fs.copySync(path.join(process.cwd(), TEST, 'kit/steamer-example1'), path.join(PROJECT, 'steamer-project3'));
        process.chdir(project3);
    });

    after(() => {
        process.chdir(CUR_ENV);
    });

    it("install template", function (done) {

        this.timeout(10000);


        var kit = new SteamerKit({
            t: true,
        });
        kit.init();

        userInput("data", "\n", 1);
        userInput("data", "\n", 2);
        userInput("data", "npm\n", 3);
        userInput("data", "\n", 4);
        userInput("data", "detail\n", 5);

        userInputEnd(function () {
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

    it("install template with template config", function (done) {

        this.timeout(10000);

        var kit = new SteamerKit({
            template: true,
        });
        kit.init();

        userInput("data", "\n", 1);
        userInput("data", "comment\n", 2);

        userInputEnd(function () {
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
