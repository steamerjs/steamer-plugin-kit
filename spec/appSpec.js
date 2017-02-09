"use strict";

const path = require('path'),
	  fs = require('fs');


describe("steamer-plugin-ak", function() {
  	it("=> install", function() {
        
        let folder = path.resolve('specPlugin/steamer-example'),
            files = fs.readdirSync(folder);

        expect(files.includes('.eslintrc.js')).toBe(true);
        expect(files.includes('.gitignore')).toBe(true);
        expect(files.includes('.steamer')).toBe(true);
        expect(files.includes('.stylelintrc.js')).toBe(true);
        expect(files.includes('README.md')).toBe(true);
        expect(files.includes('config')).toBe(true);
        expect(files.includes('package.json')).toBe(true);
        expect(files.includes('src')).toBe(true);
        expect(files.includes('tools')).toBe(true);

        let kitConfig = require("../specPlugin/steamer-example/.steamer/steamer-plugin-kit") || {};

        kitConfig.config = kitConfig.config || {};

        expect(kitConfig.plugin).toBe("steamer-plugin-kit");
        expect(kitConfig.config.kit).toBe("steamer-example");

  	});

    it("=> update", function() {

        let bkFolder = path.resolve('specPlugin/steamer-example/backup'),
            bksubFolder = fs.readdirSync(bkFolder);

        bksubFolder = path.join(bkFolder, bksubFolder[0]);

        let bkFiles = fs.readdirSync(bksubFolder);

        expect(bkFiles.includes('README.md')).toBe(true);
        expect(bkFiles.includes('package.json')).toBe(true);
        expect(bkFiles.includes('tools')).toBe(true);

    });
});