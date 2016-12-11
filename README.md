### steamer-plugin-kit

manage starter kit

### Installation
```javascript
npm i -g steamer-cli

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
```javascript
// In command 1
gulp dev

// In command 2
./node_modules/.bin/steamer kit react steamer-react
```
