const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const compareVer = require('compare-versions');
const klawSync = require('klaw-sync');
const colors = require('colors');
/**
 * delete require cache from filePath
 * @param {String} filePath file path
 */
exports.delRequireCache = function (filePath) {
    let realpath = fs.realpathSync(filePath);
    if (require.cache[realpath]) {
        delete require.cache[realpath];
    }
};

/**
 * get name space from repo url for starterkit
 * @param {String} repoParam repo url
 */
exports.getNameSpace = function (repoParam) {
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
exports.getKitName = function (ns) {
    let kit = null;
    if (ns.split('/').length === 3) {
        kit = ns.split('/')[2];
    }
    return kit;
};

exports.getPkgJson = function (localPath) {
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
exports.help = function () {
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

exports.addVersion = function (oldVers, newVer) {
    if (oldVers.indexOf(newVer) === -1) {
        // addin if not exists
        oldVers.push(newVer);
    }
    // sort
    oldVers.sort(function (a, b) {
        return compareVer(b, a);
    });
    return oldVers;
};

exports.getVersion = function (tag) {
    return tag.replace(/[a-zA-Z]+/gi, '');
};

/**
 * check folder empty or not
 * @param {*} folderPath
 */
exports.checkEmpty = function (folderPath, ignoreFiles = []) {
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
exports.writeKitOptions = function (options = {}) {
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
exports.getKitOptions = function () {
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

exports.spinSuccess = function (msg) {
    this.spinner.stop().succeed([msg]);
};

exports.spinFail = function (kitName, err = null, reject = null) {
    if (err) {
        this.spinner.stop().fail([`${kitName} ${err}`]);
        reject && reject(err);
    }
};

/**
 *  read starterkit config
 * @param {String} kitConfigPath
 */
exports.readKitConfig = function (kitConfigPath) {
    exports.delRequireCache.bind(this)(kitConfigPath);
    return require(kitConfigPath);
};

exports.createPluginConfig = function (conf, folder) {
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
exports.walkAndReplace = function (folder, extensions = [], replaceObj = {}) {
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
                function (match) {
                    return replaceObj[key];
                }
            );
        });

        this.fs.writeFileSync(file.path, content, 'utf-8');
    });
};

/**
 * check if the folder or file exists
 * @param {String} path
 */
exports.existFolderOrFile = async function (path) {
    return new Promise(function (resolve, reject) {
        return fs.exists(path, e => {
            resolve(e);
        });
    });
};

exports.readConfig = function () {
    return fs
        .readFileSync(`${path.resolve('.')}/templateconfig.json`)
        .toString();
};
/**
 * get folders or files in the path
 * @param {String} filePath
 * @param {Array} filterFolder
 * @param {Boolean} folder
 */
exports.getFolderOrFiles = function (filePath, filterFolder = [], folder = true) {
    return new Promise(function (resolve, reject) {
        return fs.readdir(path.resolve(filePath), 'utf8', (_, files) => {
            if (!files) {
                resolve([]);
                return false;
            }
            const filters = [].concat(filterFolder);
            const f = files.filter(v => {
                if (folder) {
                    return !v.includes('.') && !filters.includes(v);
                } else {
                    return v.includes('.') && !filters.includes(v);
                }
            });
            resolve(f);
        });
    });
};

/**
*create folder
@param filePath
*/
exports.createFolder = function (filePath) {
    return new Promise(function (resolve, reject) {
        fs.mkdir(filePath, function (err) {
            if (err) {
                if (err.errno === -2) {
                    console.log(colors.red('can not find folder'));
                }
            } else {
                console.log(colors.green('create folder: '));
                console.log(colors.underline(`${filePath}`));
            }
            resolve();
        });
    });
};

/**
 * @param args:{
 *  filePath component name
 *  componentName component`s name
 *  componentFileName component`s file name
 *  className
 *  templatePath template path
 * }
 */
exports.createFile = function ({
    filePath,
    componentName,
    componentFileName,
    className,
    templatePath
}) {
    const data = {
        componentName,
        componentFileName,
        filePath,
        className
    };
    data.templateFolderPath = path.join(templatePath);
    return new Promise(async (resolve, reject) => {
        await readAndWiteFile(data, resolve);
    });
};
/**
 * read template`s contents and write to you component’s file
 * @param args:{
 *  templateFolderPath
 *  componentName
 *  componentFileName
 *  filePath
 *  className
 * }
 * @param resolve
 */
function readAndWiteFile(
    {
        templateFolderPath,
        componentName,
        componentFileName,
        filePath,
        className
    },
    resolve
) {
    fs.readdir(templateFolderPath, 'utf8', (err, files) => {
        if (err) {
            console.log(colors.red(err));
            return false;
        }
        files.forEach(templateName => {
            const newComponentName = templateName
                .replace('TemplateName', componentFileName)
                .replace('.txt', '');

            // 1.create folder
            fs.createWriteStream(`${filePath}/${newComponentName}`);
            // 2.rea & write template contents
            const content = fs
                .readFileSync(`${templateFolderPath}/${templateName}`)
                .toString() // read template`s contents
                // replace template contens
                .replace(/\${TemplateName}/g, componentName.split('.')[0])
                .replace(/\${template-name}/g, className);
            // replace templateName to your component name
            fs.writeFileSync(
                `${filePath}/${newComponentName}`,
                content,
                'utf8'
            );

            console.log(colors.green('write file: '));
            console.log(colors.underline(`${filePath}/${newComponentName}`));
        });

        resolve();
    });
}
