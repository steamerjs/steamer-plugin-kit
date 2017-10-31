# steamer-plugin-kit

starter kit 管理命令

[![NPM Version](https://img.shields.io/npm/v/steamer-plugin-kit.svg?style=flat)](https://www.npmjs.com/package/steamer-plugin-kit)
[![Travis](https://img.shields.io/travis/steamerjs/steamer-plugin-kit.svg)](https://travis-ci.org/steamerjs/steamer-plugin-kit)
[![Deps](https://david-dm.org/steamerjs/steamer-plugin-kit.svg)](https://david-dm.org/steamerjs/steamer-plugin-kit)
[![Coverage](https://img.shields.io/coveralls/steamerjs/steamer-plugin-kit.svg)](https://coveralls.io/github/steamerjs/steamer-plugin-kit)

## 内置
`steamer-plugin-kit` 已经默认作为 `steamerjs` 的内置插件，全局安装 `steamerjs` 后即可使用。如果你额外安装 `steamer-plugin-kit`，则会优先使用这个额外安装的包。


## 安装
```javascript
// 必须
npm i -g steamerjs

// v2.0 后可选
npm i -g steamer-plugin-kit
```

## 设置 `NODE_PATH`

由于 `steamerjs` 的命令或脚手架都需要全局安装，尽管steamerjs会尝试兼容，但在某些使用场景下会仍然找到不全局安装的位置，因此推荐设置环境变量 `NODE_PATH`。

[常见问题 - NODE_PATH设置](https://steamerjs.github.io/docs/introduction/Steamer-QA.html)

## 更新
```
npm i -g steamer-plugin-kit@latest

// 或者
steamer update
```

## 使用 -- 部署脚手架

* 全局安装你想用的脚手架

`v1.2.0` 之后，这步可省略，如果你的脚手架没有全局安装，插件会自动帮你用 `npm` 命令进行全局安装。

```javascript

// 官方推荐脚手架
npm i -g steamer-react steamer-vue steamer-simple 
npm i -g steamer-react-component steamer-vue-component steamer-simple component

```

* 部署脚手架

此命令会罗列所有 符合 [steamer 脚手架规范](https://github.com/steamerjs/steamer-example/#如何开发一个-steamer-规范的-starterkit) 的脚手架，你可以选择并进行安装：
```javascript
steamer kit

? which starterkit do you like:  (Use arrow keys)

  * Local installed Starter Kits:
❯ simple: alloyteam frameworkless starterkit

  * Other official Starter Kits:
  react: alloyteam react starterkit
  vue: alloyteam vue starterkit
  simple-component: alloyteam frameworkless component development starterkit
  react-component: alloyteam react component development starterkit
  vue-component: alloyteam vue component development starterkit
```

或者，你可以通过 `steamer` 命令，指定 `starter kit`， 并拷贝到指定目录和初始化脚手架：

```javascript
steamer kit --install react --path project
// 或
steamer kit -i react -p project
// 或
steamer kit -i react
```

这样，会自动帮你将脚手架 `steamer-react` (输入命令时，允许省略 "steamer-" ) 的内容拷贝到 `project` 目录下。如果你不指定 `project` 目录，那它会自动生成到与脚手架同名的目录中。


你也可以安装在指定命名空间下的脚手架，如：

```javascript
steamer kit -i @tencent/react
```

这种情况下，它也会把文件拷贝到 `steamer-react` 目录下。 

脚手架部署完成后，它会帮你自动进入项目中，运行 `npm install`。你也可以通过中止命令，选用其它安装工具例如 `yarn` 进行依赖安装。

* 罗列脚手架

```javascript
steamer kit --list
// 或
steamer kit -l
```

## 使用 -- 更新脚手架

* 更新项目脚手架

如果脚手架有更新，首先全局更新脚手架

```javascript
npm install -g steamer-react@latest
```

然后进入项目目录中，进行更新

```javascript
cd project

steamer kit --update
// 或
steamer kit -u
```

如果你是从github上直接将steamer体系的脚手架clone下来，而你又想升级，可以指定某个脚手架名字，如：

```javascript
cd project

steamer kit --update react
或
steamer kit -u react
```

该命令主要是更新项目中的 `package.json`， `readme`， 和 `tools`文件夹，然后将这三个旧的文件（夹）备份到 backup 目录下（有时间戳的文件夹），其余文件保持不变。如果有改动到tools下面构建相关的逻辑，可能需要手动进行更新。

## 使用 -- 在脚手架中生成模板

* 创建模板

一些脚手架为了快速开发，会整理了一些模板。可以用以下命令快速从模板源文件中生成页面到对应的目录下。

假如模板存放在脚手架中的 `tools/template/` 目录里，其中模板 `list` 有以下文件：

```
// index.js
var a = 123;
var b = ""<% title %>

// index.html
<script src="js/<% title %>"></script>
<link rel="stylesheet" href="js/<% title %>">
```

* 基于模板创建页面

使用以下命令，可以快速开始生成模板：

```javascript
steamer kit --template
// 或
steamer kit -t
```

如果脚手架上没有 `template` 配置，命令行会先分别询问模板的源目录、目标目录是什么，输入后，会自动生成到配置中，然后会列出模板源目录中所有的可用模板，然后选择其中一个，再输入生成后的页面名称，即可生成模板目录。 上面文件内容中的 <% title %> 会自动匹配成页面的名称。

```javascript
? type the template source folder: ./tools/template
? type your template destination folder:  ./src/page
? type your npm command(npm|tnpm|cnpm etc):  npm
which template do you like:  (Use arrow keys)
❯ index
  list
  preact-list
  spa
? type in your page name:  detail
```

```javascript
// template配置后的脚手架配置信息，位置在 .steamer/steamer-plugin-kit中

module.exports = {
    "plugin": "steamer-plugin-kit",
    "config": {
        "kit": "steamer-example1",
        "version": "2.0.0",
        "template": {
            "src": "./tools/template",
            "dist": "./src/page"
        }
    }
};
```

有些模板可能有自己特殊的依赖，可以在模板源目录中，新建一个 `dependency.js`的依赖配置文件，然后写入模板对应的依赖，那么生成模板的时候，会自动安装相应的依赖。可参考 `steamer-react` 的[dependency.js](https://github.com/steamerjs/steamer-react/blob/master/tools/template/dependency.js)

```javascript
module.exports = {
	"list": {
		"react-list-scroll": "^1.0.2",
		"react-touch-component": "^1.1.1"
	}
}
```


## 开发

将此模块链接到全局下

```javascript
npm link
```

安装以下 `scoped package`

```javascript
cd specPlugin/scope-package/steamer-react-hy

npm link
```

运行测试用例

```javascript
npm i -g eslint // 安装eslint

npm i -g steamer-example // 安装测试中使用到的steamer-example 脚手架

npm test
```

## Starter Kit 的例子
符合 `steamer` 规范的 `Starter Kit`，可以参考 [steamer-example](https://github.com/steamerjs/steamer-example/)，并仿照规范，进行接入。

官方 Starter Kit:
* react starter kit: [steamer-react](https://github.com/steamerjs/steamer-react/)
* vue starter kit: [steamer-vue](https://github.com/steamerjs/steamer-vue/)
* 无框架 starter kit: [steamer-simple](https://github.com/steamerjs/steamer-simple/)
* react 组件开发 starter kit: [steamer-react-component](https://github.com/steamerjs/steamer-react-component/)
* vue 组件开发 starter kit: [steamer-vue-component](https://github.com/steamerjs/steamer-vue-component/)
* 无框架 组件开发 starter kit: [steamer-simple-component](https://github.com/steamerjs/steamer-simple-component/)
