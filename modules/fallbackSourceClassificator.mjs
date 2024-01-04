// Fallback source: https://iopwiki.com/wiki/User:MoonlightArchivist/Guidelines#Texts
// Author: MoonlightArchivist
// Thanks for your archiving efforts <3
const EVENTS = [
    {name: "CH. 5.5: Operation Cube+", story: true, num_only: false, prefixes: ["-7-"]}, //"-1-" is a copy of "-6-" for whatever reason
    {name: "Chapter 7", story: true, num_only: true, prefixes: ["7-"]},
    {name: "CH. 7.5: Arctic Warfare", story: true, num_only: false, prefixes: ["-2-", "-3-", "-4-", "-5-"]},
    {name: "Chapter 8", story: true, num_only: true, prefixes: ["8-"]},
    {name: "Guilty Gear x BlazBlue: Operation Rabbit Hunt", story: false, num_only: false, prefixes: ["-8-"]},
    {name: "CH 8.5: Deep Dive", story: true, num_only: false, prefixes: ["-10", "-11", "-12", "-13"]},
    {name: "Chapter 9", story: true, num_only: true, prefixes: ["9-"]},
    {name: "Chapter 10", story: true, num_only: true, prefixes: ["10-"]},
    {name: "Houkai Gakuen 2nd: Only Master (Fantranslated)", story: false, num_only: false, prefixes: ["-14", "-15"]},
    {name: "CH 10.5: Singularity", story: true, num_only: false, prefixes: ["-16", "-17", "-18"]},
    {name: "DJMax Respect: Glory Day", story: false, num_only: false, prefixes: ["-19", "-20"]},
    {name: "CH 10.75: Continuum Turbulence", story: true, num_only: false, prefixes: ["-24", "-25", "-26", "-27", "-28"]},
    {name: "Chapter 11", story: true, num_only: true, prefixes: ["11-"]},
    {name: "CH. 11.5: ISOMER", story: true, num_only: false, prefixes: ["-31"]},
    {name: "VA-11 HALL-A", story: false, num_only: false, prefixes: ["-32"]},
    {name: "CH. 11.75: Shattered Connexion", story: true, num_only: false, prefixes: ["-33"]},
    {name: "Chapter 12", story: true, num_only: true, prefixes: ["12-"]},
    {name: "Halloween 2019: Freaky Pandemic", story: false, num_only: false, prefixes: ["-34"]},
    {name: "Christmas 2019: A Snowy Night Capriccio", story: false, num_only: false, prefixes: ["-35"]},
    {name: "CH 12.5: Polarized Light", story: true, num_only: false, prefixes: ["-36"]},
    {name: "Chapter 13", story: true, num_only: true, prefixes: ["13-"]},
    {name: "White Day 2020: The Photo Studio Mystery", story: false, num_only: false, prefixes: ["-37"]},
    {name: "Gunslinger Girl", story: false, num_only: false, prefixes: ["-38"]},
    {name: "Summer 2020: Far Side of the Sea", story: false, num_only: false, prefixes: ["-40"]},
    {name: "CH. 13.5: Dual Randomness", story: true, num_only: false, prefixes: ["-41"]},
    {name: "Halloween 2020: Butterfly In A Cocoon", story: false, num_only: false, prefixes: ["-42"]},
    {name: "The Division", story: false, num_only: false, prefixes: ["-43"]},
    {name: "CH. 13.75: Mirror Stage", story: true, num_only: false, prefixes: ["-44"]},
    {name: "Untranslated", story: false, num_only: false, prefixes: ["-45"]},
    {name: "Dropkick On My Devil: My Devil's Frontline", story: false, num_only: false, prefixes: ["-46"]},
    {name: "Summer 2021: The Waves Wrangler", story: false, num_only: false, prefixes: ["-47"]},
    {name: "CH. 13.X: Poincaré Recurrence", story: true, num_only: false, prefixes: ["-48"]},
    {name: "Christmas 2021: One Coin Short", story: false, num_only: false, prefixes: ["-49"]},
    {name: "White Day 2022: Love Bakery", story: false, num_only: false, prefixes: ["-50"]},
    {name: "CH. 13.Z: Fixed Point", story: true, num_only: false, prefixes: ["-51", "-99"]},
    {name: "Summer 2022: Lycan Sanctuary", story: false, num_only: false, prefixes: ["-52"]},
    {name: "Longitudinal Strain", story: true, num_only: false, prefixes: ["-54"]},
    {name: "Eclipses & Saros", story: true, num_only: false, prefixes: ["-56"]},
    {name: "Zombie Land Saga: The Glistening Bloom", story: false, num_only: false, prefixes: ["-57"]},
    {name: "Ch. ???: Slowshock (WIP)", story: true, num_only: false, prefixes: ["-58"]},
    {name: "Maze Guess", story: false, num_only: false, prefixes: ["-59"]},

    {name: "Additional Materials", episode: "Assimilation Tutorial", story: false, num_only: false, prefixes: ["tutorials/"]},
    {name: "VA-11 HALL-A", episode: "Additional stories", story: false, num_only: false, prefixes: ["va11/"]},
    {name: "Skin Stories", episode: "{FALLBACK}", story: false, num_only: false, prefixes: ["skin/"]},
    {name: "MOD 3 Stories", episode: "{FALLBACK}", story: false, num_only: false, prefixes: ["memoir/"]},
    {name: "Bookshelf of Memories", episode: "{FALLBACK}", story: false, num_only: false, prefixes: ["fetter/"]},
    {name: "Anniversary", episode: "{FALLBACK}", story: false, num_only: false, prefixes: ["anniversary/"]},
    {name: "Additional Materials", episode: "In-combat texts", story: false, num_only: false, prefixes: ["battleavg/"]},
    {name: "Additional Materials", episode: "Player Return event", story: false, num_only: false, prefixes: ["returnplayer/"]},
    {name: "Additional Materials", episode: "Theater guide", story: false, num_only: false, prefixes: ["theater/"]},
]

function findSourceByPrefix(filename) {
    for (const event of EVENTS) {
        for (let prefix of event.prefixes) {
            if (filename.startsWith(prefix) && 
                (event.num_only ? /^[1-9-]*\.txt$/.test(filename) : true))
                return {name: event.name, episodeName: event.episode ?? "{FALLBACK}", story: false}
        }
    }

    return {name: "Unknown", episode: "Unknown", story: false}
}

export default findSourceByPrefix