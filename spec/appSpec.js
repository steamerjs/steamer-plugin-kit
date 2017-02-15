"use strict";

const path = require('path'),
	  fs = require('fs');


describe("steamer-plugin-ak", function() {
  	it("=> install", function() {
        
        let folder = path.resolve('specPlugin/steamer-example'),
            files = fs.readdirSync(folder);

        expect(!!~files.indexOf('.eslintrc.js')).toBe(true);
        expect(!!~files.indexOf('.steamer')).toBe(true);
        expect(!!~files.indexOf('.stylelintrc.js')).toBe(true);
        expect(!!~files.indexOf('README.md')).toBe(true);
        expect(!!~files.indexOf('config')).toBe(true);
        expect(!!~files.indexOf('package.json')).toBe(true);
        expect(!!~files.indexOf('src')).toBe(true);
        expect(!!~files.indexOf('tools')).toBe(true);

        let kitConfig = require("../specPlugin/steamer-example/.steamer/steamer-plugin-kit") || {};

        kitConfig.config = kitConfig.config || {};

        expect(kitConfig.plugin).toBe("steamer-plugin-kit");
        expect(kitConfig.config.kit).toBe("steamer-example");

        let projectConfig = require("../specPlugin/steamer-example/config/steamer.config.js") || {};

        expect(projectConfig.webserver).toBe('//localhost:9000/');
        expect(projectConfig.cdn).toBe('//localhost:8000/');
        expect(projectConfig.port).toBe(9000);
        expect(projectConfig.route).toBe('/');
  	});

    it("=> update", function() {

        let bkFolder = path.resolve('specPlugin/steamer-example/backup'),
            bksubFolder = fs.readdirSync(bkFolder);

        bksubFolder = path.join(bkFolder, bksubFolder[0]);

        let bkFiles = fs.readdirSync(bksubFolder);

        expect(!!~bkFiles.indexOf('README.md')).toBe(true);
        expect(!!~bkFiles.indexOf('package.json')).toBe(true);
        expect(!!~bkFiles.indexOf('tools')).toBe(true);

    });

    it("=> update without .steamer/steamer-plugin-kit", function() {

        let bkFolder = path.resolve('specPlugin/steamer-example/backup'),
            bksubFolder = fs.readdirSync(bkFolder);

        bksubFolder = path.join(bkFolder, bksubFolder[0]);

        let bkFiles = fs.readdirSync(bksubFolder);

        expect(!!~bkFiles.indexOf('README.md')).toBe(true);
        expect(!!~bkFiles.indexOf('package.json')).toBe(true);
        expect(!!~bkFiles.indexOf('tools')).toBe(true);

        let kitConfig = require("../specPlugin/steamer-example1/.steamer/steamer-plugin-kit") || {};

        kitConfig.config = kitConfig.config || {};

        expect(kitConfig.plugin).toBe("steamer-plugin-kit");
        expect(kitConfig.config.kit).toBe("steamer-example");

    });
});

describe("steamer-plugin-ak for scoped package", function() {
    it("=> install", function() {
        
        let folder = path.resolve('specPlugin/steamer-react-hy'),
            files = fs.readdirSync(folder);
            
        expect(!!~files.indexOf('.eslintrc.js')).toBe(true);
        expect(!!~files.indexOf('.steamer')).toBe(true);
        expect(!!~files.indexOf('.stylelintrc.js')).toBe(true);
        expect(!!~files.indexOf('README.md')).toBe(true);
        expect(!!~files.indexOf('config')).toBe(true);
        expect(!!~files.indexOf('package.json')).toBe(true);
        expect(!!~files.indexOf('src')).toBe(true);
        expect(!!~files.indexOf('tools')).toBe(true);

        let kitConfig = require("../specPlugin/steamer-react-hy/.steamer/steamer-plugin-kit") || {};

        kitConfig.config = kitConfig.config || {};

        expect(kitConfig.plugin).toBe("steamer-plugin-kit");
        expect(kitConfig.config.kit).toBe("@tencent/steamer-react-hy");

        let projectConfig = require("../specPlugin/steamer-react-hy/config/steamer.config.js") || {};

        expect(projectConfig.webserver).toBe('//localhost:9001/');
        expect(projectConfig.cdn).toBe('//localhost:8001/');
        expect(projectConfig.port).toBe('9001');
        expect(projectConfig.route).toBe('/news/');

    });

    it("=> update", function() {

        let bkFolder = path.resolve('specPlugin/steamer-react-hy/backup'),
            bksubFolder = fs.readdirSync(bkFolder);

        bksubFolder = path.join(bkFolder, bksubFolder[0]);

        let bkFiles = fs.readdirSync(bksubFolder);

        expect(!!~bkFiles.indexOf('README.md')).toBe(true);
        expect(!!~bkFiles.indexOf('package.json')).toBe(true);
        expect(!!~bkFiles.indexOf('tools')).toBe(true);

    });

    it("=> update without .steamer/steamer-plugin-kit", function() {

        let bkFolder = path.resolve('specPlugin/steamer-react-hy1/backup'),
            bksubFolder = fs.readdirSync(bkFolder);

        bksubFolder = path.join(bkFolder, bksubFolder[0]);

        let bkFiles = fs.readdirSync(bksubFolder);

        expect(!!~bkFiles.indexOf('README.md')).toBe(true);
        expect(!!~bkFiles.indexOf('package.json')).toBe(true);
        expect(!!~bkFiles.indexOf('tools')).toBe(true);

        let kitConfig = require("../specPlugin/steamer-react-hy1/.steamer/steamer-plugin-kit") || {};

        kitConfig.config = kitConfig.config || {};

        expect(kitConfig.plugin).toBe("steamer-plugin-kit");
        expect(kitConfig.config.kit).toBe("@tencent/steamer-react-hy");

    });
});


describe("check kit name and folder name", function() {

    var KIT = require('../index');

    it("=> check getKitName @tencent/xxx", function() {
        var kit = new KIT({
            install: "@tencent/example"
        });

        expect(kit.getKitName(kit.argv.install)).toBe('@tencent/steamer-example');
    });

    it("=> => check getKitName @tencent/steamer-xxx", function() {
        var kit = new KIT({
            install: "@tencent/steamer-example"
        });

        expect(kit.getKitName(kit.argv.install)).toBe('@tencent/steamer-example');
    });

    it("=> check getFolderName @tencent/xxx", function() {

        var kit = new KIT({
            install: "@tencent/example"
        });

        let kitName = kit.getKitName(kit.argv.install);

        expect(kit.getFolderName(kitName)).toBe('steamer-example');
    });

    it("=> check getFolderName @tencent/steamer-xxx", function() {

        var kit = new KIT({
            install: "@tencent/steamer-example"
        });

        let kitName = kit.getKitName(kit.argv.install);

        expect(kit.getFolderName(kitName)).toBe('steamer-example');
    });
});