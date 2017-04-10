## steamer-plugin-kit

starter kit 管理命令

[![NPM Version](https://img.shields.io/npm/v/steamer-plugin-kit.svg?style=flat)](https://www.npmjs.com/package/steamer-plugin-kit)
[![Travis](https://img.shields.io/travis/SteamerTeam/steamer-plugin-kit.svg)](https://travis-ci.org/SteamerTeam/steamer-plugin-kit)
[![Deps](https://david-dm.org/SteamerTeam/steamer-plugin-kit.svg)](https://david-dm.org/SteamerTeam/steamer-plugin-kit)
[![Coverage](https://img.shields.io/coveralls/SteamerTeam/steamer-plugin-kit.svg)](https://coveralls.io/github/SteamerTeam/steamer-plugin-kit)

### 安装
```javascript
npm i -g steamerjs

npm i -g steamer-plugin-kit
```

### 使用

* 全局安装你想用的脚手架

`v1.2.0` 之后，这步可省略，如果你的脚手架没有全局安装，插件会自动帮你用 `npm` 命令进行全局安装。

```javascript

npm i -g steamer-react

```

* 罗列脚手架

```javascript
steamer kit --list
// 或
steamer kit -l
```

* 部署脚手架

此命令会罗列所有 符合 [steamer 脚手架规范](https://github.com/SteamerTeam/steamer-example/#如何开发一个-steamer-规范的-starterkit) 的脚手架，你可以选择并进行安装：
```javascript
steamer kit
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


* 更新项目脚手架

如果脚手架有更新，首先全局更新脚手架

```javascript
npm update -g steamer-react
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


### 开发

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

### Starter Kit 的例子
符合 `steamer` 规范的 `Starter Kit`，可以参考 [steamer-example](https://github.com/SteamerTeam/steamer-example/)，并仿照规范，进行接入。

官方 Starter Kit:
* react starter kit: [steamer-react](https://github.com/SteamerTeam/steamer-react/)
* vue starter kit: [steamer-vue](https://github.com/SteamerTeam/steamer-vue/)
* 无框架 starter kit: [steamer-simple](https://github.com/SteamerTeam/steamer-simple/)
* react 组件开发 starter kit: [steamer-react-component](https://github.com/SteamerTeam/steamer-react-component/)