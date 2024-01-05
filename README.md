# Girls' Frontline Linguistic Analysis Kit
Aka a thing to count the words in *the best ~~visual novel~~ girls & guns game ever released*

## How to use
Node v21+ is recommended
```
npm i
npm start
```
By default, all the neccessary data and tools will be downloaded into a temp directory, and you will get results in `result.json` and `result.csv`

You can configure everything using `config.mjs`, all variable names are pretty self-explanatory

## Third-party software usage notice
- [Asset Ripper](https://github.com/AssetRipper/AssetRipper) is used to extract neccessary data. It will be downloaded, unpacked and executed automatically. Much thanks to all contributors!
- [gfl-cutscene-interpreter](https://dev.s-ul.net/BLUEALiCE/gfl-cutscene-interpreter/-/tree/master) code is used to parse cutscenes, all related code is contained within `modules/rawToOpCodes.mjs`.
GFL chapter database provided by the project is also used to map filenames to specific chapters and episodes. Thanks, \@AmWorks, I owe you a coffee!
