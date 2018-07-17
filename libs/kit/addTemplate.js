/**
 * addTemplate operator
 */

const inquirer = require('inquirer');
const path = require('path');
inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'));
const colors = require('colors');
const { existFolderOrFile, readConfig, getFolderOrFiles, createFolder, createFile } = require('./utils');

/**
 * Create page from template
 */
module.exports = async function () {
    const data = await performPrompts();
    const args = {
        componentName: data.componentName,
        componentFileName: data.componentFileName,
        path: data.placementPath,
        templatePath: data.templatePath
    };
    start(args);
};

function judgeOverridden() {
    return new Promise(async function (resolve, _) {
        const ans = await inquirer.prompt([
            {
                type: 'input',
                name: 'res',
                message: 'Folder already exists, overridden?：y/n'
            }
        ]);
        if (ans.res === 'y' || ans.res === '') {
            resolve({ overridden: true });
        } else {
            resolve({ overridden: false });
        }
    });
}

async function performPrompts() {
    // Check that the templateconfig.json exists
    const templateconfig = await existFolderOrFile('templateconfig.json');
    if (!templateconfig) {
        console.log(
            `${colors.red('please Create the templateconfig.json file')}`
        );
        process.exit();
    }
    // Determines if the folder in the configuration file exists
    const { templatepath, componentPlacementPath } = JSON.parse(
        readConfig()
    );
    const existTemplatepathFolder = await existFolderOrFile(
        `${templatepath}`
    );
    const existComponentPlacementPathFolder = await existFolderOrFile(
        `${componentPlacementPath}`
    );
    if (!existTemplatepathFolder || !existComponentPlacementPathFolder) {
        console.log(
            `${colors.red(
                'please Create the corresponding folder based on the templateconfig.json file'
            )}`
        );
        process.exit();
    }
    // 1.type the component name which you want to add, to create a folder by this name
    const inputComponentName = [
        {
            type: 'input',
            name: 'componentName',
            message: 'please input the component name',
            validate: function (input) {
                // Declare function as asynchronous, and save the done callback
                const done = this.async();

                // Do async stuff
                setTimeout(function () {
                    if (input.replace(/(^\s*)|(\s*$)/g, '') === '') {
                        // Pass the return value in the done callback
                        done('componentName can not be null');
                        return;
                    }
                    // Pass the return value in the done callback
                    done(null, true);
                }, 300);
            }
        }
    ];
    // 2.type component‘s file’s name， default index
    const inputComponentFileName = [
        {
            type: 'input',
            name: 'componentFileName',
            message: 'please input the component‘s file’s name',
            default: 'index'
        }
    ];
    // 3.choose your template
    const template = await getFolderOrFiles(templatepath);
    const templateChoice = [].concat(template);
    if (!templateChoice.length) {
        console.log(`${colors.red('please Create your templates')}`);
        process.exit();
    }
    const selectTemplate = [
        {
            type: 'list',
            name: 'template',
            message: 'please choose your template',
            choices: templateChoice
        }
    ];
    // 4.choose your placement
    const selectPlacementPath = [
        {
            type: 'fuzzypath',
            name: 'path',
            pathFilter: (isDirectory, nodePath) => isDirectory,
            // pathFilter :: (Bool, String) -> Bool
            // pathFilter allows to filter FS nodes by type and path
            rootPath: componentPlacementPath,
            // rootPath :: String
            // Root search directory
            message: 'please choose your placement',
            default: 'components',
            suggestOnly: false
            // suggestOnly :: Bool
            // Restrict prompt answer to available choices or use them as suggestions
        }
    ];
    // perform prompts
    const prompts = []
        .concat(inputComponentName)
        .concat(inputComponentFileName)
        .concat(selectTemplate)
        .concat(selectPlacementPath);
    return new Promise(async function (resolve, reject) {
        const answers = await inquirer.prompt(prompts);
        const existFileFolder = await existFolderOrFile(
            `${answers.path}/${answers.componentName}`
        );
        if (existFileFolder) {
            const { overridden } = await judgeOverridden();
            if (overridden) {
                resolve({
                    componentName: answers.componentName,
                    componentFileName: answers.componentFileName,
                    placementPath: answers.path,
                    templatePath: `${templatepath}/${answers.template}`
                });
            } else {
                process.exit();
            }
        } else {
            resolve({
                componentName: answers.componentName,
                componentFileName: answers.componentFileName,
                placementPath: answers.path,
                templatePath: `${templatepath}/${answers.template}`
            });
        }
    });
}

async function start(args) {
    args.componentName = args.componentName.toString();

    const componentName =
        args.componentName.substring(0, 1).toUpperCase() +
        args.componentName.substring(1); // this first toUpperCase
    let className = ''; // change the capital letters but not first to '-Lowercase letters'
    const componentFileName = args.componentFileName;

    for (let i = 0; i < args.componentName.length; i++) {
        if (/[A-Z]/.test(args.componentName[i]) && !!i) {
            className += '-';
        }
        className += args.componentName[i].toLowerCase();
    }
    if (args.path !== '') {
        args.path += '/';
    }
    const filePath = path.resolve(args.path) + '/' + componentName;

    const createFileData = {
        filePath,
        componentName,
        componentFileName,
        className,
        templatePath: args.templatePath
    };
    // create floder
    await createFolder(filePath);

    // create file
    await createFile(createFileData);

    process.exit();

}
