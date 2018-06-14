const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const compareVer = require('compare-versions');
const klawSync = require('klaw-sync');
const inquirer = require('inquirer');
const _ = require('lodash');

/**
 * delete require cache from filePath
 * @param {String} filePath file path
 */
exports.delRequireCache = function(filePath) {
    let realpath = fs.realpathSync(filePath);
    if (require.cache[realpath]) {
        delete require.cache[realpath];
    }
};

/**
 * get name space from repo url for starterkit
 * @param {String} repoParam repo url
 */
exports.getNameSpace = function(repoParam) {
    let localPath = '';
    if (repoParam.indexOf('http') >= 0) {
        let repo = url.parse(repoParam);
        if (!repo.host) {
            return this.error('Please input correct repo url');
        }
        localPath = `${repo.host}${repo.pathname.replace('.git', '')}`;
    } else if (repoParam.indexOf('git@') === 0) {
        localPath = repoParam
            .replace('git@', '')
            .replace('.git', '')
            .replace(':', '/');
    } else if (typeof this.kitOptions.list[repoParam] !== 'undefined') {
        localPath = exports.getNameSpace.bind(this)(this.kitOptions.list[repoParam].url);
    }

    return localPath;
};

/**
 * get starterkit name from name space
 * @param {String} ns name space of starterkit
 */
exports.getKitName = function(ns) {
    let kit = null;
    if (ns.split('/').length === 3) {
        kit = ns.split('/')[2];
    }
    return kit;
};

exports.getPkgJson = function(localPath) {
    let pkgJsonPath = path.join(localPath, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
        exports.delRequireCache.bind(this)(pkgJsonPath);
        return require(pkgJsonPath);
    } else {
        throw new Error('package.json does not exist');
    }
};

/**
 * help
 */
exports.help = function() {
    this.printUsage(this.description, 'kit');
    this.printOption([
        {
            option: 'list',
            alias: 'l',
            description: 'list all available starter kits'
        },
        {
            option: 'add',
            alias: 'i',
            value:
                '[<git repo>|<git repo> --tag <tag name>|--alias <starterkit name>]',
            description: 'install starter kit'
        },
        {
            option: 'develop',
            alias: 'd',
            description: 'develop starterkit and make it on starterkit list'
        },
        {
            option: 'update',
            alias: 'u',
            value: '[--global]',
            description:
                'update starter kit for project or update global starterkit'
        },
        {
            option: 'remove',
            alias: 'r',
            value: '<starterkit name>',
            description: 'remove starterkit'
        }
    ]);
};

exports.addVersion = function(oldVers, newVer) {
    if (oldVers.indexOf(newVer) !== -1) {
        // addin if not exists
        oldVers.push(newVer);
    }
    // sort
    oldVers.sort(function(a, b) {
        return compareVer(b, a);
    });
    return oldVers;
};

exports.getVersion = function(tag) {
    return tag.replace(/[a-zA-Z]+/gi, '');
};

/**
 * check folder empty or not
 * @param {*} folderPath
 */
exports.checkEmpty = function(folderPath, ignoreFiles = []) {
    // 查看目标目录是否为空
    if (path.resolve(folderPath) === process.cwd()) {
        let folderInfo = fs.readdirSync(folderPath);
        folderInfo = folderInfo.filter(item => {
            return !ignoreFiles.includes(item);
        });
        return !folderInfo.length;
    } else {
        return !fs.existsSync(folderPath);
    }
};

/**
 * write starterkit options
 * @param {Object} options starter kit options
 */
exports.writeKitOptions = function(options = {}) {
    try {
        // let updatedOptions = this.getKitOptions();

        // updatedOptions.timestamp = Date.now();
        this.fs.ensureFileSync(this.kitOptionsPath);
        this.fs.writeFileSync(
            this.kitOptionsPath,
            `module.exports = ${JSON.stringify(options, null, 4)};`,
            'utf-8'
        );
    } catch (e) {
        this.error(e.stack);
    }
};

/**
 * get starterkit options from $Home/.steamer/starterkits/starterkits.js
 */
exports.getKitOptions = function() {
    if (!this.fs.existsSync(this.kitOptionsPath)) {
        let options = {
            list: {},
            timestamp: Date.now()
        };
        this.fs.ensureFileSync(this.kitOptionsPath);
        this.fs.writeFileSync(
            this.kitOptionsPath,
            `module.exports = ${JSON.stringify(options, null, 4)};`,
            'utf-8'
        );
    }

    exports.delRequireCache.bind(this)(this.kitOptionsPath);

    let kitOptions = require(this.kitOptionsPath);

    return kitOptions;
};

exports.spinSuccess = function(msg) {
    this.spinner.stop().succeed([msg]);
};

exports.spinFail = function(kitName, err = null, reject = null) {
    if (err) {
        this.spinner.stop().fail([`${kitName} ${err}`]);
        reject && reject(err);
    }
};

/**
 *  read starterkit config
 * @param {String} kitConfigPath
 */
exports.readKitConfig = function(kitConfigPath) {
    exports.delRequireCache.bind(this)(kitConfigPath);
    return require(kitConfigPath);
};

exports.createPluginConfig = function(conf, folder) {
    let config = conf;

    this.createConfig(config, {
        folder: folder,
        overwrite: true
    });
};

/**
 * loop files and replace placeholder
 * @param {String} folder
 * @param {*} extensions
 * @param {*} replaceObj
 */
exports.walkAndReplace = function(folder, extensions = [], replaceObj = {}) {
    let files = klawSync(folder, { nodir: true });

    if (extensions.length) {
        files = files.filter(item => {
            let ext = path.extname(item.path);
            return extensions.includes(ext);
        });
    }

    files.forEach(file => {
        let content = this.fs.readFileSync(file.path, 'utf-8');

        Object.keys(replaceObj).forEach(key => {
            content = content.replace(
                new RegExp('<% ' + key + ' %>', 'g'),
                function(match) {
                    return replaceObj[key];
                }
            );
        });

        this.fs.writeFileSync(file.path, content, 'utf-8');
    });
};

/**
 * copy starterkit files to project folder
 */
function copyFiles({
    files,
    kitQuestions,
    folderPath,
    kitPath,
    kit,
    ver,
    isSteamerKit,
    projectName,
    kitConfig
}) {
    // 脚手架相关配置问题
    let prompt = inquirer.createPromptModule();
    prompt(kitQuestions)
        .then(answersParam => {
            let answers = Object.assign({}, answersParam, {
                projectName
            });

            // 复制文件前的自定义行为
            if (
                kitConfig.beforeInstallCopy &&
                _.isFunction(kitConfig.beforeInstallCopy)
            ) {
                kitConfig.beforeInstallCopy.bind(this)(answers, folderPath);
            }

            let newFiles = files.filter(item => {
                return !this.ignoreFiles.includes(item);
            });

            newFiles.forEach(item => {
                let srcFiles = path.join(kitPath, item);
                let destFile = path.join(folderPath, item);

                if (this.fs.existsSync(srcFiles)) {
                    this.fs.copySync(srcFiles, destFile);
                }
            });

            if (answers.webserver) {
                this.fs.ensureFileSync(
                    path.join(folderPath, 'config/steamer.config.js')
                );
                this.fs.writeFileSync(
                    path.join(folderPath, 'config/steamer.config.js'),
                    'module.exports = ' + JSON.stringify(answers, null, 4)
                );
            }

            // 复制文件后的自定义行为
            if (
                kitConfig.afterInstallCopy &&
                _.isFunction(kitConfig.afterInstallCopy)
            ) {
                kitConfig.afterInstallCopy.bind(this)(answers, folderPath);
            }

            if (isSteamerKit) {
                exports.createPluginConfig.bind(this)(
                    {
                        kit: kit,
                        version: ver
                    },
                    folderPath
                );
            }

            // 替换项目名称
            if (projectName) {
                const oldPkgJson = exports.getPkgJson.bind(this)(folderPath);
                let pkgJson = _.merge({}, oldPkgJson, {
                    name: projectName
                });
                this.fs.writeFileSync(
                    path.join(folderPath, 'package.json'),
                    JSON.stringify(pkgJson, null, 4),
                    'utf-8'
                );
            }
            // beforeInstall 自定义行为
            if (
                kitConfig.beforeInstallDep &&
                _.isFunction(kitConfig.beforeInstallDep)
            ) {
                kitConfig.beforeInstallDep.bind(this)(answers, folderPath);
            }

            // 安装项目node_modules包
            this.spawn.sync(this.config.NPM, ['install'], {
                stdio: 'inherit',
                cwd: folderPath
            });

            // afterInstall 自定义行为
            if (
                kitConfig.afterInstallDep &&
                _.isFunction(kitConfig.afterInstallDep)
            ) {
                kitConfig.afterInstallDep.bind(this)(answers, folderPath);
            }

            this.success(`The project is initiated success in ${folderPath}`);
        })
        .catch(e => {
            this.error(e.stack);
        });
}

/**
 * install or update kit to project
 */
exports.installProject = function(options, isInit = true) {
    let { kit, ver, folder, projectName } = options;

    let kitPath = path.join(this.kitHomePath, kit);
    let kitConfigPath = path.join(kitPath, `.steamer/${kit}.js`);
    let kitConfig = {};
    let isSteamerKit = false;
    let folderPath = path.join(process.cwd(), folder);
    let kitQuestions = [];
    let files = [];

    this.git(kitPath).checkout(ver, () => {
        // 查看是否能获取steamer规范的脚手架配置
        if (this.fs.existsSync(kitConfigPath)) {
            kitConfig = exports.readKitConfig.bind(this)(kitConfigPath);
            files = new Set(kitConfig.installFiles || kitConfig.files);
            files.add('package.json');
            kitQuestions = isInit && kitConfig.options ? kitConfig.options : [];
            isSteamerKit = true;
        } else {
            files = new Set(this.fs.readdirSync(kitPath));
        }

        // 做去重
        files = Array.from(files);

        let isEmpty = exports.checkEmpty.bind(this)(folderPath, this.ignoreFiles);
        let overwriteQuestion = [];

        if (!isEmpty && isInit) {
            overwriteQuestion.push({
                type: 'text',
                name: 'overwrite',
                message: 'The foler is not empty, do you wanna overwrite?',
                default: 'n'
            });
        }

        let prompt = inquirer.createPromptModule();
        prompt(overwriteQuestion)
            .then(answers => {
                if (
                    !answers.hasOwnProperty('overwrite') ||
                    (answers.overwrite && answers.overwrite === 'y')
                ) {
                    copyFiles.bind(this)({
                        files,
                        kitQuestions,
                        folderPath,
                        kitPath,
                        kit,
                        ver,
                        isSteamerKit,
                        projectName,
                        kitConfig
                    });
                }
            })
            .catch(e => {
                this.error(e.stack);
            });
    });
};
