### steamer-plugin-kit

starter kit 管理命令

### 安装
```javascript
npm i -g steamerjs

npm i -g steamer-plugin-kit
```

### Usage
```javascript
// 首先，将 starter kit 进行全局安装
npm i -g stearm-react

// 然后，通过 steamer 命令，将 starter kit 拷贝到指定目录，并初始化
steamer kit --install <starterkit> --path <targetPath> 
// 或
steamer kit -i <starterkit> -p <targetPath>
// 或
steamer kit -i <starterkit>

// 若需要升级，先进行项目文件夹，然后通过命令进行升级和必要文件的备份

cd <targetPath>

steamer kit --update
// or
steamer kit -u

// 备份的文件会在 backup 目录下面，用时间戳命令的文件夹保存，src 目录不会被备份

```

### 开发
```
// 将此模块链接到全局下
npm link

// 运行测试用例
npm test
```

### Starter Kit 的例子
符合 `steamer` 规范的 `Starter Kit`，可以参考 [steamer-example](https://github.com/SteamerTeam/steamer-example/)，并仿照规范，进行接入。

官方 Starter Kit:
* react starter kit: [steamer-react](https://github.com/SteamerTeam/steamer-react/)
* vue starter kit: [steamer-vue](https://github.com/SteamerTeam/steamer-vue/)
* 无框架 starter kit: [steamer-simple](https://github.com/SteamerTeam/steamer-simple/)
