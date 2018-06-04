const path = require("path");
const fs = require("fs");

module.exports = {
    files: [
        "src",
        "tools",
        "config",
        "README.md",
        ".eslintrc.js",
        ".stylelintrc.js",
        ".gitignore"
    ],

    beforeInstallCopy: function (answers, folderPath) {
        console.log('====beforeInstallCopy====');
    },

    afterInstallCopy: function (answers, folderPath) {
        console.log('====afterInstallCopy====');
    },

    beforeInstallDep: function (answers, folderPath) {
        console.log('====beforeInstallDep====');
        if (answers.jest) {
            let pkg = this.getPkgJson(folderPath);
            pkg.scripts = Object.assign({}, pkg.scripts, {
                test: "jest"
            });
            fs.writeFileSync(
                path.join(folderPath, "package.json"),
                JSON.stringify(pkg, null, 4),
                "utf-8"
            );
        }
    },

    afterInstallDep: function (answers, folderPath) {
        console.log('====afterInstallDep====');
    },

    options: [
        {
            type: "input",
            name: "webserver",
            message: "html url(//localhost:9000/)"
        },
        {
            type: "input",
            name: "cdn",
            message: "cdn url(//localhost:8000/)"
        },
        {
            type: "input",
            name: "port",
            message: "development server port(9000)"
        },
        {
            type: "input",
            name: "route",
            message: "development server directory(/news/)"
        },
        {
            type: "confirm",
            name: "jest",
            message: "use jest?",
            default: true
        }
    ]
};
