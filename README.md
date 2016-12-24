### steamer-plugin-kit

manage starter kit

### Installation
```javascript
npm i -g steamerjs

npm i -g steamer-plugin-kit
```

### Usage
```javascript
// install starterkit globally first, for example:
npm i -g stearm-react

// install starter kit
steamer kit --install <starterkit> --path <targetPath> 
// or
steamer kit -i <starterkit> -p <targetPath>
// or
steamer kit -i <starterkit>

// update starter kit and backup

cd <targetPath>

steamer kit --update
// or
steamer kit -u

// backup files will be under backup folder in the order of date. src won't be backed up

```

### Develop
```
// link the module to global path
npm link

// go through test cases
npm test
```
