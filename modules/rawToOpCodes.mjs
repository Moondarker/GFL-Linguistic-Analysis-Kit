import { promises as fs } from "fs"

//For JSON structured or making your own
//Pro tip: use opcode2string.indexOf(s) to get the opcode number
const opcode2string = [
    'stopBGM',
    'bgm',
    'bg',
    'speaker',
    'msg',
    'portrait',
    'INVALID - DO NOT USE',
    'msgboxTransition',
    'fgEffect', //Snow or rain
    'stopEffect',
    'nightFilter',
    'fadeOut',
    'fadeIn',
    'choice',
    'destination',
    'credits',
    'credits2',
    'soundEffect1',
    'soundEffect2',
    'video',
    "msg_centered",
    //"position"
    //'setMaskedPortrait'
]

const OPCODES = {
    STOPBGM: 0,
    BGM: 1,
    BG: 2,
    SPEAKER: 3,
    MSG: 4,
    PORTRAIT: 5,
    //NOPORTRAIT : 6,
    MSGBOXTRANSITION: 7,
    FG_EFFECT: 8,
    STOPEFFECTS: 9,
    NIGHTFILTER: 10,
    FADEOUT: 11,
    FADEIN: 12,
    CHOICE: 13,
    DESTINATION: 14,
    CREDITS: 15,
    CREDITS2: 16,
    SE1: 17,
    SE2: 18,
    VIDEO: 19,
    MSG_CENTERED: 20,
    //Position and Scale should not be opcodes, they should be parameters for the portrait opcode.
    //POSITION : 21,
    //SCALE : 22
    //SETMASKEDPORTRAIT : 8
}

const tag2opcode = {
    "Speaker": OPCODES.SPEAKER,
    "BIN": OPCODES.BG,
    "BGM": OPCODES.BGM,
    "下雪": OPCODES.FG_EFFECT,
    "火焰销毁": OPCODES.STOPEFFECTS,
    "Night": OPCODES.NIGHTFILTER,
    "黑屏1": OPCODES.FADEOUT,
    "黑屏2": OPCODES.FADEIN,
    '分支': OPCODES.DESTINATION,
    '名单': OPCODES.CREDITS,
    '名单2': OPCODES.CREDITS2,
    "SE1": OPCODES.SE1,
    "SE2": OPCODES.SE2,
    //"Position":OPCODES.POSITION,
    //"Scale":OPCODES.SCALE
    //"通讯框":OPCODES.SETMASKEDPORTRAIT,
}

//https://stackoverflow.com/a/29998400
function JavaSplit(string, separator, n) {
    var split = string.split(separator);
    if (split.length <= n)
        return split;
    var out = split.slice(0, n - 1);
    out.push(split.slice(n - 1).join(separator));
    return out;
}

function sliceAndRemove(str, begin, end) {
    return str.slice(0, begin) + str.slice(end)
}

function getFromTag(str, tag) {
    const beginTag = "<" + tag + ">"
    const endTag = "</" + tag + ">"
    var n = str.indexOf(beginTag)
    if (n != -1) {
        return str.slice(n + beginTag.length, str.indexOf(endTag))
    }
    return null
}

function removeTag(str, tag) {
    const beginTag = "<" + tag + ">"
    const endTag = "</" + tag + ">"
    return sliceAndRemove(str, str.indexOf(beginTag), str.indexOf(endTag) + endTag.length)
}

class PortraitClass {
    constructor(name, type, dim, isMasked, xOffset, yOffset, scale) {
        this.name = name;
        this.type = type;
        this.dim = dim;
        this.isMasked = isMasked;
        this.x = xOffset;
        this.y = yOffset;
        this.scale = scale;
    }

    /*static clone(pStruct){
        return new PortraitStruct(pStruct.name,pStruct.type,)
    }*/
    clone() {
        return new PortraitClass(this.name, this.type, this.dim, this.isMasked, this.x, this.y, this.scale)
    }

    hasOffset() {
        return this.x != 0 || this.y != 0
    }

    /**
     * Compare this PortraitStruct with another one.
     * @author AmWorks
     * @date 2021-11-21
     * @param {PortraitClass}
     * @returns {boolean}
     */
    equals(pStruct) {
        return (
            this.name == pStruct.name &&
            this.type == pStruct.type &&
            this.dim == pStruct.dim &&
            this.isMasked == pStruct.isMasked &&
            this.x == pStruct.x &&
            this.y == pStruct.y &&
            this.scale == pStruct.scale
        )
    }

    toString() {
        let s = "name: " + this.name + " | type: " + this.type + " | dim: " + this.dim + " | isMasked: " + this.isMasked
        if (this.hasOffset())
            s += " | offset: (" + this.x + "," + this.y + ")"
        if (this.scale != 1.0)
            s += " | scale: " + this.scale
        return s;
    }
}

class CutsceneParser {
    constructor() {
        this.PORTRAITS = null
        this.CHAPTER_DB = null
        this.MUSIC = null
        this.BACKGROUNDS = null
        this.FILE_TO_CHAPTER = null
    }

    static chapterDBtoFileMap(chapterDB) {
        const result = {}

        for (const storyType of ['main', 'event', 'side', 'crossover']) {
            for (const chapter of chapterDB[storyType]) {
                for (const episode of chapter.episodes) {
                    for (const part of episode.parts) {
                        result[part] = {
                            name: chapter.name,
                            episodeName: episode.name,
                            story: ['main', 'event'].includes(storyType) && (chapter.name.includes('Chapter') ? episode.name.includes('Normal') : true)
                        }
                    }
                }
            }
        }

        return result
    }

    async fetchData() {
        if (this.MUSIC !== null) return

        try {
            const data = JSON.parse(await fs.readFile('./db.json', { encoding: 'utf-8' }))

            this.PORTRAITS = data['portraits']
            this.CHAPTER_DB = data['story']
            this.MUSIC = data['music']
            this.BACKGROUNDS = data['bg']
            this.FILE_TO_CHAPTER = CutsceneParser.chapterDBtoFileMap(this.CHAPTER_DB)
        } catch (e) {
            if (e.code !== 'ENOENT') throw e

            let data = await (await fetch('https://gfl.amaryllisworks.pw/chapterDatabase.json')).json()

            this.PORTRAITS = await (await fetch('https://gfl.amaryllisworks.pw/portraitInformation.json')).json()
            this.CHAPTER_DB = data['story']
            this.MUSIC = data['music']
            this.BACKGROUNDS = data['bg']
            this.FILE_TO_CHAPTER = CutsceneParser.chapterDBtoFileMap(this.CHAPTER_DB)

            await fs.writeFile('./db.json', JSON.stringify({
                portraits: this.PORTRAITS,
                story: this.CHAPTER_DB,
                music: this.MUSIC,
                bg: this.BACKGROUNDS
            }, null, 2), { encoding: 'utf-8' })
        }
    }

    async getDatabase() {
        if (this.MUSIC === null) await this.fetchData()

        return {
            portraits: this.PORTRAITS,
            story: this.CHAPTER_DB,
            music: this.MUSIC,
            bg: this.BACKGROUNDS,
            fileMap: this.FILE_TO_CHAPTER
        }
    }

    /**
     * This method takes a string of gfl script, then returns structured lines. It produces no side effects.
     * @author AmWorks
     * @date 2021-11-21
     * @param {string} out
     * @param {number=} missionID
     * @param {string=} fileName - For custom text
     * @returns {any[]}
     */
    async convertGFLTextToOpcodes(out, missionID, fileName = "") {
        if (this.MUSIC === null) await this.fetchData();

        //console.log(out);
        var lines = out.split(/\r?\n/);
        //The GFL text structure is stupid so I'm going to convert it to my own.
        let structuredLines = [];


        //This ignores lines that are completely blank, sometimes the scripts have them
        //But we want to match them up for retranslation since other languages will remove the empty lines
        var realLineNumber = 0;

        for (let i = 0; i < lines.length; i++) {
            if (!lines[i])
                continue;
            //console.log(lines[i]);
            //console.assert(lines[i].includes(':'),"This line is missing a \":\"... Bad line? | "+lines[i])
            let [cmds, text] = JavaSplit(lines[i].replace("：", ':').replace("；", ";"), ":", 2)
            console.assert(cmds, lines[i])
            //There can be lines without any text so asserting is pointless
            //console.assert(text,lines[i])
            //console.log(text)
            //

            //Yeah I know tags are supposed to be in order, No I don't really care sorry

            //So portraits are set in any order... But how the fuck are you supposed to tell when a name is if there's <> tags
            //I'm just going to search portraits after removing <> tags, it probably won't matter
            let numPortraits = 0;
            let thisLineHadAtLeastTwoPortraits = (cmds.indexOf(";") != -1)

            //Apply dimming by checking position of <Speaker> command.
            //If ; is before the <Speaker> tag it dims the left, if it's after it dims the right.
            let shouldDimLeft = thisLineHadAtLeastTwoPortraits && cmds.lastIndexOf(";") < cmds.lastIndexOf("</Speaker>")



            //console.log(thisLineHadAtLeastTwoPortraits);
            //Limit it to 5 because I don't want a dumb infinite loop that crashes the browser
            let portraits = []
            for (j = 0; j < 5; j++) {
                //console.log(cmds)
                let charTagEnd = cmds.indexOf(")");
                if (charTagEnd != -1) {
                    //It's +1 to get rid of the ;
                    let charTagStart = Math.max(cmds.lastIndexOf(";", charTagEnd) + 1, 0)
                    let [charID, charSpr] = cmds.slice(charTagStart, charTagEnd).split("(")
                    //console.log("parsing portrait: ",charID," ",charSpr)
                    //console.log(charID)
                    //console.log(charSpr)

                    //I know it's a hackjob fix but I don't think there's going to be () in any other tags
                    if (charTagEnd > cmds.indexOf("<Speaker>") && charTagEnd < cmds.indexOf("</Speaker>")) {
                        //console.log("Parenthesis is inside the speaker tag, ignoring");
                        continue
                    }

                    if (charSpr != undefined && charSpr && charID) {

                        let shouldDim = false;
                        if (thisLineHadAtLeastTwoPortraits) {
                            //shouldDim = numPortraits < 1 ? shouldDimLeft : !shouldDimLeft
                            if (numPortraits < 1) //If we're handling the left portrait right now
                                shouldDim = shouldDimLeft;
                            else
                                shouldDim = !shouldDimLeft;
                        }

                        //Search backwards for the previous mask value because the mask command is only applied once in GFL for some reason
                        let shouldMask = false;
                        //It's -2 because the last line is always MSGBOXTRANSITION.
                        for (var lll = structuredLines.length - 2; lll >= 0; lll--) {
                            let m = structuredLines[lll];
                            if (m[0] == OPCODES.PORTRAIT) {
                                if (m[1].length == 0)
                                    break;
                                else {
                                    for (let j = 0; j < m[1].length; j++) {
                                        let p = m[1][j]
                                        if (p.name == charID) {
                                            shouldMask = p.isMasked;
                                            //console.log("Found previous portrait, previous mask value was "+shouldMask)
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                        }


                        portraits.push(new PortraitClass(charID, charSpr, shouldDim, shouldMask, 0, 0, 1.0))
                        //nextPortraitIsMasked = false;
                        numPortraits++;
                    }
                    //If charID and not charSpr, this sets speaker
                    else if (charID) {
                        structuredLines.push([OPCODES.SPEAKER, charID])
                    }
                    //The () command sets the speaker to "".
                    //In fact () always sets the name, you just don't see it because <Speaker> is used in EN.
                    else {
                        //structuredLines.push([OPCODES.PORTRAIT,[]])
                        structuredLines.push([OPCODES.SPEAKER, ""])
                        //numPortraits=0;
                    }
                    cmds = sliceAndRemove(cmds, charTagStart, charTagEnd + 1);
                }
                else {
                    //console.log("Done... Let's exit");
                    break;
                }
            }

            //If portrait is force dimmed
            //TODO: Fix this... Somehow. I don't know.
            if (cmds.indexOf("<同时置暗>") != -1) {
                for (var lll = 0; lll < portraits.length; lll++) {
                    portraits[lll].dim = true;
                }
            }
            let shouldScale = getFromTag(cmds, "Scale")
            if (shouldScale) {
                for (var lll = 0; lll < portraits.length; lll++) {
                    portraits[lll].scale = shouldScale;
                }
            }
            let hasPosition = getFromTag(cmds, "Position")
            if (hasPosition) {
                let tmp_pos = hasPosition.split(",")
                for (var lll = 0; lll < portraits.length; lll++) {
                    portraits[lll].x = tmp_pos[0];
                    portraits[lll].y = tmp_pos[1]
                }
            }


            let equalToLastPortraits = (function () {
                for (var lll = structuredLines.length - 2; lll >= 0; lll--) //It's -2 because the last line is always MSGBOXTRANSITION.
                {
                    let m = structuredLines[lll];
                    if (m[0] == OPCODES.PORTRAIT) {
                        if (m[1].length == portraits.length) {

                            for (let j = 0; j < m[1].length; j++) {
                                let p1 = portraits[j];
                                let p2 = m[1][j];
                                if (p1.equals(p2)) {

                                }
                                else
                                    return false;
                            }
                            return true;
                        }
                        return false;
                    }
                }
            })()
            if (!equalToLastPortraits)
                structuredLines.push([OPCODES.PORTRAIT, portraits]);


            //Doesn't work if array size is less than 3
            //There's also practically no reason to support this
            /*let positionRes = getFromTag(cmds,"Position")
            if (positionRes != null)
            {
                for(var lll=structuredLines.length-1; lll>=0; lll--)
                {
                    let m = structuredLines[lll];
                	
                    if (m[0]==OPCODES.PORTRAIT)
                    {
                        //Because somehow arrays aren't references in javascript, I have to access the original var and then assign to it
                        structuredLines[lll][1][structuredLines[lll][1].length-1]=structuredLines[lll][1][structuredLines[lll][1].length-1].concat(positionRes.split(','))
                        //console.log('added position to portrait '+p)
                        console.log(structuredLines[lll])
                    }
                    else if (m[0]==OPCODES.MSGBOXTRANSITION)
                        break;
                }
            }*/

            let speakerRes = getFromTag(cmds, "Speaker")
            //debugger;
            if (speakerRes != undefined) {
                let prevLine = structuredLines[structuredLines.length - 1]
                //Optimization: If prevLine was another speaker line, overwrite it instead of writing another
                if (prevLine[0] == OPCODES.SPEAKER)
                    structuredLines[structuredLines.length - 1] = [OPCODES.SPEAKER, speakerRes]
                else
                    structuredLines.push([OPCODES.SPEAKER, speakerRes])
                cmds = removeTag(cmds, "Speaker")
            }

            let bgmRes = getFromTag(cmds, "BGM")

            if (bgmRes != null) {
                if (bgmRes == "BGM_Empty")
                    structuredLines.push([OPCODES.STOPBGM])
                else {
                    //If music exists in db then rename it before pushing
                    structuredLines.push([OPCODES.BGM, this.MUSIC[bgmRes] || bgmRes])
                }
            }

            //It's impossble to filter out duplicate background commands ahead of time because the night command is applied after the background command
            const tags = ["BIN", "名单2", "SE1", "SE2"]
            tags.forEach(tag => {
                //console.log(tag);
                let tagRes = getFromTag(cmds, tag);
                //console.log(tagRes)
                if (tagRes != null) {
                    console.assert(tag2opcode[tag], "Tag " + tag + " not present in tag2opcode")
                    structuredLines.push([tag2opcode[tag], tagRes])
                    cmds = removeTag(cmds, tag)
                }
            })

            //For commands that don't have an argument and require no special behavior to parse.
            /*const tagsNoArgs=['名单']
            tags.forEach(tag => {
                structuredLines.push([tag2opcode[tag]])
                cmds=cmds.replace("<"+tag+">","");
            })*/
            if (cmds.includes('<名单>')) {
                if (missionID != undefined) {
                    structuredLines.push([OPCODES.CREDITS, missionID])
                    cmds = cmds.replace("<名单>", "");
                }
                else {
                    structuredLines.push([OPCODES.MSG, "<color=#ff0000>(Missing mission ID, can't load credits! Go yell at the site owner!)</color>"])
                }
            }



            //Destination label
            let destRes = getFromTag(cmds, '分支')
            if (destRes != null) {
                for (var lll = structuredLines.length - 1; lll >= 0; lll--) {
                    let m = structuredLines[lll];
                    if (m[0] == OPCODES.MSGBOXTRANSITION) {
                        structuredLines.splice(lll + 1, 0, [OPCODES.DESTINATION, destRes])
                        //console.log("Pushed label tag at idx "+(lll+1))
                        //console.log(structuredLinesToString(structuredLines))
                        break;
                    }
                }
                cmds = removeTag(cmds, '分支')
            }


            //Search backwards to find the last background command and set isNight flag true
            if (cmds.includes("<Night>")) {
                //console.log("")
                for (var lll = structuredLines.length - 1; lll >= 0; lll--) {
                    let m = structuredLines[lll];
                    console.assert(m)
                    if (m[0] == OPCODES.BG) {
                        // Night filter can be set without changing bg so it's better to push a new command.
                        structuredLines.push([OPCODES.BG, m[1], true])
                        //m.push(true)
                        break;
                    }
                }
                cmds = cmds.replace("<Night>", "");
            }

            if (cmds.includes("<关闭蒙版>")) {
                structuredLines.push([OPCODES.STOPEFFECTS]);
                cmds = cmds.replace("<关闭蒙版>", "")
            }

            let common_effect = getFromTag(cmds, 'common_effect')
            if (common_effect != null) {
                //<common_effect>%%code=DoomsdayClock01%%wait=1%%</common_effect>
                let _cmds = common_effect.split("%%")
                for (var j = 0; j < _cmds.length; j++) {
                    let _cmd = _cmds[j].split('=')
                    if (_cmd.length > 1) {
                        let whitelistedCommands = [
                            "DoomsdayClock01",
                            "DoomsdayClock02",
                            "DoomsdayClock03",
                            "DoomsdayClock04",
                            "DoomsdayClock05",
                            "DoomsdayClock06",
                            "DoomsdayClock07",
                            "AllSeeingEye01",
                            "AllSeeingEye02",
                            "AllSeeingEye03",
                            "AllSeeingEye04"
                        ]
                        if (whitelistedCommands.includes(_cmd[1])) {
                            structuredLines.push([OPCODES.VIDEO, _cmd[1]])
                        }
                        else if (_cmd[1] == "CJ_snow") {
                            structuredLines.push([OPCODES.FG_EFFECT, 0]);
                        }
                        else if (_cmd[1] == "CJ_rain")
                            structuredLines.push([OPCODES.FG_EFFECT, 1]);
                    }


                }
            }


            //const tags = [
            //var nextPortraitIsMasked = false;
            //Since portraits are searched before modifiers...
            while (cmds.includes("<通讯框>")) {
                let idxToCheck = 0;

                let posOfMaskCmd = cmds.indexOf("<通讯框>");
                let posOfCmdDivider = cmds.indexOf(";")
                //console.log(posOfCmdDivider+" "+posOfMaskCmd+" "+cmds)
                //If this line had more than one portrait AND the ; is before the mask command, we should be masking the portrait at idx 1 instead of 0
                if (posOfCmdDivider > -1 && posOfCmdDivider < posOfMaskCmd) {
                    //console.log("checking portrait on right side to mask")
                    idxToCheck = 1;
                }

                for (var lll = structuredLines.length - 1; lll >= 0; lll--) {
                    let m = structuredLines[lll];
                    console.assert(m)
                    if (m[0] == OPCODES.MSG) {
                        //consoleWarn("Found a message opcode before a portrait opcode... Messages shouldn't exist at this point")
                        break;
                    }
                    else if (m[0] == OPCODES.PORTRAIT) {
                        //console.log("set mask true for portrait "+portraitStructToString(structuredLines[lll]))
                        //console.log(structuredLines[lll])
                        if (idxToCheck > structuredLines[lll][1].length - 1) //Applying the mask command when there's no portraits is an actual thing MICA does. Is it to make my life harder? Who knows.
                        {
                            console.warn(`[CutsceneParser] WTF? Tried to set a mask command but there's no portraits in ${fileName}.`);
                            console.warn(`[CutsceneParser] ${lines[i]}`)
                            //consoleWarn(cmds)
                        }
                        else
                            structuredLines[lll][1][idxToCheck].isMasked = true;
                        break;
                    }
                }
                cmds = cmds.replace("<通讯框>", "");
            }

            //Now do text... But first check if there is any text (some lines are only commands)
            if (text) {
                //narrator opcode centers text in the middle.
                let thisTextIsCentered = cmds.includes("<narrator>");

                //Snow effect is on the right hand side for some reason
                ["火焰销毁", '下雪'].forEach(tag => {
                    let tagRes = getFromTag(text, tag);
                    if (tagRes != null) {
                        structuredLines.push([tag2opcode[tag], tagRes])
                        text = removeTag(text, tag)
                    }
                })

                /*
                And now, for something crazy...
                GFL doesn't use the tab character (why would it?). But we can shove
                our own text here. This allows for multilanguage support like GGZ.
                However, we cannot put opcodes in our custom text.
                */
                let msgColumns = text.split("\t")
                for (let mm = 0; mm < msgColumns.length; mm++) {
                    msgColumns[mm] = msgColumns[mm].split("+")
                }

                for (let mm = 0; mm < msgColumns[0].length; mm++) {
                    let msg = msgColumns[0][mm]
                    //Each line broken message has a unique ID, so a message in total has 100 possible slots for line breaks.
                    //A message usually only has 3 or so line breaks (+ symbol) but it's good to be safe right?
                    let msgID = fileName + "/" + (realLineNumber * 100 + mm)

                    //Check for choice tag here. <c> is always at the end, so it's fine
                    let choiceStart = msg.indexOf('<c>')
                    if (choiceStart != -1) {
                        let MsgOpcode = [thisTextIsCentered ? OPCODES.MSG_CENTERED : OPCODES.MSG, msg.slice(0, choiceStart), msgID]
                        for (let xx = 1; xx < msgColumns.length; xx++) {
                            if (msgColumns[xx][mm]) //If message at idx mm exists in column xx 
                                MsgOpcode.push(msgColumns[xx][mm])
                        }

                        structuredLines.push(MsgOpcode)
                        structuredLines.push([OPCODES.CHOICE, msg.slice(choiceStart + 3).split('<c>')])
                    }
                    else {
                        let MsgOpcode = [thisTextIsCentered ? OPCODES.MSG_CENTERED : OPCODES.MSG, msg, msgID]
                        for (let xx = 1; xx < msgColumns.length; xx++) {
                            if (msgColumns[xx][mm])
                                MsgOpcode.push(msgColumns[xx][mm])
                        }
                        structuredLines.push(MsgOpcode)
                    }

                }
            }
            //open/close msgbox
            structuredLines.push([OPCODES.MSGBOXTRANSITION])

            realLineNumber++;
        }
        return structuredLines;
    }
}
export { OPCODES, CutsceneParser }