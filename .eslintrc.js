module.exports = {
	"env": {
        "browser": true,
        "node": true,
        "commonjs": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    rules: {
    	"indent": 0,
    	"no-console": 0,
        "no-redeclare": 1,
        "no-unused-vars": 1,
    	"no-mixed-spaces-and-tabs": 0,
    	"semi": 2,
        "no-inner-declarations": 1,
        "no-extra-boolean-cast": 0,
    },
    "globals": {
        "describe": true,
        "it": true,
        "before": true,
        "after": true,
        "beforeEach": true,
        "afterEach": true
    }
};