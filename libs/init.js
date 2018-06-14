const Rx = require('rxjs');
const inquirer = require('inquirer');
const path = require('path');

const {
    installProject
} = require('../utils/kit');



/**
 * init project
 *
 * @export
 */
module.exports = function() {
    let kits = this.kitOptions.list;
    // let questions = [];
    let choices = [];

    Object.keys(kits).forEach(key => {
        choices.push({
            name: `${key} - ${kits[key].description}`,
            value: key
        });
    });

    let answers = {};
    let prompts = new Rx.Subject();
    inquirer.prompt(prompts).ui.process.subscribe(
        obj => {
            switch (obj.name) {
                case 'kit': {
                    prompts.next({
                        type: 'list',
                        name: 'ver',
                        message: 'Which version do you need: ',
                        choices: kits[obj.answer].versions
                    });
                    answers.kit = obj.answer;
                    break;
                }
                case 'ver': {
                    prompts.next({
                        type: 'text',
                        name: 'folder',
                        default: './',
                        message: 'Which folder is your project in: '
                    });
                    answers.ver = obj.answer;
                    break;
                }
                case 'folder': {
                    answers.folder = obj.answer.trim();
                    prompts.next({
                        type: 'text',
                        name: 'projectName',
                        message: 'type your project name:',
                        default: path.basename(answers.folder)
                    });

                    prompts.complete();
                    break;
                }
                case 'projectName':
                    answers.projectName = obj.answer.trim();
                    break;
            }
        },
        () => {},
        () => {
            installProject.bind(this)(answers);
        }
    );

    prompts.next({
        type: 'list',
        name: 'kit',
        message: 'Which starterkit do you wanna install: ',
        choices: choices,
        pageSize: 100
    });
};
