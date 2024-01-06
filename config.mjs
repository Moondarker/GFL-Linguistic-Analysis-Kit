const output = {
    'json': 'result.json',
    'csv': 'result.csv'
}

const ignoredFiles = [
    'profiles.txt'
]

const stringPostprocessing = [
    x => x.replace(/<\/?[^>]+(>|$)/g, ''), // filter out tags
    x => x.replace(/[!@#$%^&*()_+~`\-=;№:?.,<>]/g, ''), // filter out all special characters, this approach was chosen due to presence of cyrillic and diacritic-containing letters
    x => x.replace(/\s{2,}/g, ' '), // ensure only one space remains between words now
    x => x.trim() // trim spaces and tabs before and after the string
]

const patches = [
    {
        chapter: 'Houkai Gakuen 2nd: Only Master (Fantranslated)',
        action: 'delete' // reason: not translated in-game
    },
    {
        chapter: 'DJMax Respect: Glory Day',
        episode: '{FALLBACK}',
        action: 'delete' // reason: "-19-1-2First.txt";"-19-2-2First.txt";"-19-3-2First.txt" are duplicates of respective non-First files
    },
    {
        chapter: 'CH 10.75: Continuum Turbulence',
        episode: '{FALLBACK}',
        action: 'delete' // reason: all seem to be duplicates. TODO: double-check
    },
    {
        chapter: 'Halloween 2019',
        action: 'rename',
        name: 'Halloween 2019: Freaky Pandemic'
    },
    {
        chapter: 'Christmas 2019',
        action: 'rename',
        name: 'Christmas 2019: A Snowy Night Capriccio'
    },
    {
        chapter: 'Untranslated',
        action: 'delete' // reason: it's... Untranslated
    },
    {
        chapter: 'Longitudinal Strain (WIP)',
        action: 'rename',
        name: 'Longitudinal Strain'
    },
    {
        chapter: 'Not Ch.14: Eclipses & Saros',
        action: 'rename',
        name: 'Eclipses & Saros'
    },
    {
        chapter: 'Ch. ???: Slowshock (WIP)',
        action: 'rename',
        name: 'Slow Shock'
    },
    {
        chapter: 'Not Ch.14.1: Conjectural Labyrinth (Untranslated)',
        action: 'delete' // reason: it's... Untranslated
    },
    {
        chapter: 'Maze Guess',
        action: 'delete' // reason: not translated. yet.
    },
    {
        chapter: 'CH. 11.75: Shattered Connexion',
        episode: 'Ranking Map Tips',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.5: Dual Randomness',
        episode: 'Ranking map junk',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.75: Mirror Stage',
        episode: 'Ranking Map Tips',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.X: Poincaré Recurrence',
        episode: 'EXT',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.X: Poincaré Recurrence',
        episode: 'Fixguide.txt',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.Z: Fixed Point',
        episode: 'A bunch of random stuff',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.Z: Fixed Point',
        episode: '??? EXT',
        action: 'notstory'
    },
    {
        chapter: 'CH. 13.Z: Fixed Point',
        episode: 'Ending Test (Unused)',
        action: 'notstory'
    },
    {
        chapter: 'Longitudinal Strain',
        episode: 'U (No idea what this is)',
        action: 'notstory'
    },
    {
        chapter: 'CH. 5.5: Operation Cube+',
        episode: 'Blindfold Theorem I',
        action: 'move',
        targetChapter: 'CH. 7.75: Operation Cube+',
    },
    {
        chapter: 'CH. 5.5: Operation Cube+',
        episode: 'Blindfold Theorem II',
        action: 'move',
        targetChapter: 'CH. 7.75: Operation Cube+',
    },
    {
        chapter: 'CH. 5.5: Operation Cube+',
        episode: 'Blindfold Theorem III',
        action: 'move',
        targetChapter: 'CH. 7.75: Operation Cube+',
    },
    {
        chapter: 'CH. 5.5: Operation Cube+',
        episode: 'Blindfold Theorem IV',
        action: 'move',
        targetChapter: 'CH. 7.75: Operation Cube+',
    },
    {
        chapter: 'CH. 5.5: Operation Cube+',
        action: 'rename',
        name: 'CH. 5.5: Operation Cube',
    }
]

const determineIfStory = (storyType, chName, epName) => 
    ['main', 'event'].includes(storyType) && (chName.includes('Chapter') ? !epName.startsWith('Midnight') : true)

const downloader = {
    tempPath: '', // [string] Path to temp directory w/o trailing slash, will use OS temp directory by default
    preserveData: false, // [bool] Don't wipe temp directory after processing

    skipIntegrityChecks: false,
    fileHashes: {
        'win32': {
            'x64': {
                'download': {
                    'assetripper.zip': 'f967c610568f152dbf1d4b0d291b26ddc8650fff'
                },
                'unzip': {
                    'AssetRipper.exe': 'f644513070e868cdefafd25609ad50f3c218728a',
                    'av_libglesv2.dll': '81f751a34e0c25bdea93902a19a94a49ce1495df',
                    'capstone.dll': 'c87eb26c07bb923b6a04da3cbc31b49f64c0c59a',
                    'crunch.dll': 'a6c20da3cae9ff78df639d594d88efeee885a4d7',
                    'crunchunity.dll': '52529a1679272a693d09622027e57623d6b6dcd0',
                    'libHarfBuzzSharp.dll': '0d73478de8d07446dc41c69ca8da606d3253e7ac',
                    'libSkiaSharp.dll': '067616d01714b49b0109eb38c60497f333ffb72a',
                    'libvlc.dylib': 'abc4acecf039d3721c32ed0d760a7f317154065a',
                    'Texture2DDecoderNative.dll': '342015dc565ec32d971ae3c510dca4f05e1b7701'
                }
            },
            'arm64': {
                'download': {
                    'assetripper.zip': '51681074055f0ea05d072381e8ca1d0e50336673'
                },
                'unzip': {
                    'AssetRipper.exe': 'adffc1e7415c5b7cde2d2f8bbd205d26da2b281c',
                    'av_libglesv2.dll': '296e0b8e93c5374080304e353797f321e1abb6e5',
                    'crunch.dll': 'a6c20da3cae9ff78df639d594d88efeee885a4d7',
                    'crunchunity.dll': '52529a1679272a693d09622027e57623d6b6dcd0',
                    'libHarfBuzzSharp.dll': 'ec06aee123a758be4db1126fc0cb23b2388914d8',
                    'libSkiaSharp.dll': '41d06e64612edf8d4d1eb2832e8034fbb18f8550',
                    'libvlc.dylib': 'abc4acecf039d3721c32ed0d760a7f317154065a',
                    'Texture2DDecoderNative.dll': 'c0e96680b9a2a38e336fa23a90b0538da03a701b'
                }
            }
        },
        'linux': {
            'x64': {
                'download': {
                    'assetripper.zip': 'd80995c68f86b6c8c8f8d5ec3b5a3f756a891ab9'
                },
                'unzip': {
                    'AssetRipper': '22192782597aa57da196f633c9e0fc1fa1ee851f',
                    'crunch.dll': 'a6c20da3cae9ff78df639d594d88efeee885a4d7',
                    'crunchunity.dll': '52529a1679272a693d09622027e57623d6b6dcd0',
                    'libcapstone.so': '154fec4806cfb44033075d180822a6b375ebbc66',
                    'libHarfBuzzSharp.so': 'b6b4c66bcac83fa61c0f462a4f634d93733a5d1a',
                    'libSkiaSharp.so': '0c81cceca9358a70802e3c6a4e43c0a4e4f6a4b8',
                    'libvlc.dylib': 'abc4acecf039d3721c32ed0d760a7f317154065a',
                    'libTexture2DDecoderNative.so': 'c223c925471924010758b9749d294a2b963add57'
                }
            },
            'arm64': {
                'download': {
                    'assetripper.zip': 'c453566b3d4f032e4eae63abe3e90ec6b96eb1e4'
                },
                'unzip': {
                    'AssetRipper': '1930b093cf0b5c23fb1204668990566ccdd2e0a0',
                    'crunch.dll': 'a6c20da3cae9ff78df639d594d88efeee885a4d7',
                    'crunchunity.dll': '52529a1679272a693d09622027e57623d6b6dcd0',
                    'libcapstone.so': '2cffc566099fb068d43aa92dbcb321bac9193f4f',
                    'libHarfBuzzSharp.dll': '05bae572ee923ae98e978438ddacb9492ef73783',
                    'libSkiaSharp.dll': '66f49cf94eb0365b99492a91ceb92b9fda8a136a',
                    'libvlc.dylib': 'abc4acecf039d3721c32ed0d760a7f317154065a'
                }
            }
        }
    }
}

const assetBundleURL = 'http://gfus-cdn.sunborngame.com/android/9642eb64e84d31d52739fc7478835a436689792assettextavg.ab'

const assetRipperVersion = '0.3.3.1'
const getAssetRipperURL = (os, arch) => `https://github.com/AssetRipper/AssetRipper/releases/download/${assetRipperVersion}/AssetRipper_${os}_${arch}.zip`

export { ignoredFiles, stringPostprocessing, patches, downloader, output, assetBundleURL, getAssetRipperURL, determineIfStory }