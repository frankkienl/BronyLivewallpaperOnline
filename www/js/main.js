/*
 * Program starts here
 */
function main() {
    makeMenu();
    loadBestPony();
    loadSomeOtherPonies();
}

/** IMPORTANT **/
var isOnline = false; //online=ALL ponies; PhoneGap=Mane6

var debug = true;

//global vars
var ponies = new Array();
var DIR_LEFT = 180;
var DIR_UP = 90;
var DIR_RIGHT = 0;
var DIR_DOWN = 270;
//TODO FIX THESE
var DIR_LEFT_UP = 135;
var DIR_LEFT_DOWN = 225;
var DIR_RIGHT_UP = 45;
var DIR_RIGHT_DOWN = 325;
//
var random = new MyRandom();

function makeMenu() {
    var output = "";
    output += "<ul>\n";
    var theList;
    if (isOnline) {
        theList = listOfPonies;
    } else {
        theList = mane6;
    }
    for (var i = 0; i < theList.length; i++) {
        output += "<li><input type=\"checkbox\"";
        output += "id=\"cb_" + removeSpaces(theList[i]) + "\" ";        
        output += "/>&nbsp;";
        output += theList[i];
        output += "</li>\n";
    }
    output += "</ul>\n";
    jQuery("#div_menu").append(output);
    //add click listeners
//    for (var i = 0; i < theList.length; i++) {
//        $("#cb_" + removeSpaces(theList[i])).change(function(){
//            if( $("#cb_" + removeSpaces(theList[i])).is(":checked") ){
//                unloadPony(theList[i]);
//            } else {
//                loadPony(theList[i]);
//            }
//        });
//    }
    for (var i = 0; i < theList.length; i++) {
        $("#cb_" + removeSpaces(theList[i])).data("name",theList[i]);
        $("#cb_" + removeSpaces(theList[i])).change(function() {
            if ($(this).is(":checked")) {
                loadPony($(this).data("name"));
            } else {
                unloadPony($(this).data("name"));
            }
        });
    }
    
    $("#cb_showmenu").change(function(){
        if ($(this).is(":checked")){
            $("#div_menu").show();
        } else {
            $("#div_menu").hide();
        }
    });
}

function loadBestPony() {
    loadPony("Applejack");
}

function loadSomeOtherPonies() {
    loadPony("Twilight Sparkle");
    loadPony("Rainbow Dash");
    loadPony("Rarity");
    loadPony("Fluttershy");
    loadPony("Pinkie Pie");
}

function loadAllOtherPonies() {
    //DUDE, ARE YOU SURE YOU WANT TO DO THIS?!
    for (var i = 0; i < listOfPonies.length; i++) {
        loadPony(listOfPonies[i]);
    }
}

function loadPony(name) {
    //prevent double loading
    if (!isPonyLoaded(name)) {
        temp = new Pony(name);
        ponies[ponies.length] = temp; //sneaky bastard
        jQuery("#cb_" + temp.nameNoSpace).attr("checked", "checked"); //enable in menu
        temp.init();
    }
}

function unloadPony(name) {
    for (var i = 0; i < ponies.length; i++) {
        if (ponies[i].name === name) {
            clearInterval(ponies[i].intervalId);
            jQuery("#pony-" + ponies[i].nameNoSpace).remove(); //remove from div
            jQuery("#cb_" + ponies[i].nameNoSpace).attr("checked", "false"); //remove from menu
            ponies.splice(i, 1); //remove from array
            return;
        }
    }
}

function isPonyLoaded(name) {
    for (var i = 0; i < ponies.length; i++) {
        if (ponies[i].name === name) {
            return true;
        }
    }
    return false;
}

function removeSpaces(name) {
    return name.replace(" ", "_").replace("(", "_").replace(")", "_").replace("'", "_");
}

/**
 * Pony Object
 * @returns {undefined}
 */
function Pony(/*String*/ name) {
    //Make Class variables
    /*String*/ this.name = name;
    //replace all incompatible chars with "_" to make sure it works.
    /*String*/ this.nameNoSpace = removeSpaces(name);
    /*boolean*/ this.debug = false;
    /*float*/ this.positionX = 50; //default
    /*float*/ this.positionY = 150; //default
    /*int*/ this.width = 130; //default
    /*int*/ this.height = 96; //default
    /*boolean*/ this.outsideWrap = false;
    /*boolean*/ this.limitAtEdge = true;
    /*ArrayList<Behaviour>*/ this.behaviours = null;
    /*Behaviour*/ this.currentBehaviour = null;
    /*float*/ this.velocity = 0.0;
    /*float*/ this.direction = 0.0;
    /*long*/ this.timeToChangeBehaviour = 0;
    /*boolean*/ this.imageRight = true;
    /*long*/ this.gifTimeForNextFrame = 0;
    /*String*/this.currentGif = null;
}

Pony.prototype.init = function() {
    this.behaviours = new Array(); //clear
    var thisPony = this;
    //
    this.positionY = /*(float)*/ (10 + (Math.random() * (window.innerHeight - 150)));
    this.positionX = /*(float)*/ (10 + (Math.random() * (window.innerWidth - 150)));
    //Load pony.ini
    //jQuery.ajax("assets/" + this.name + "/pony.ini",);
    $.ajax({
        url: "assets/" + this.name + "/pony.ini",
        dataType: 'text',
        cache: false
    }).done(function(csvAsString) {
        if (debug){
            console.log("csvAsString: " + csvAsString);
        }
        //csvAsArray = csvAsString.csvToArray();
        csvAsArray = csvToArray(csvAsString, undefined); //stupid Sting-class bug *grumble*
        if (debug){
            console.log("csvArray:" + csvAsArray);
        }
        //Loop though array
        behaviourCount = 0;
        for (var i = 0; i < csvAsArray.length; i++) {
            if (csvAsArray[i][0].toLowerCase() === "behavior") {
                var tempBehaviour = new Behaviour();
                tempBehaviour.init(csvAsArray[i]);
                thisPony.behaviours[behaviourCount] = tempBehaviour;
                behaviourCount++;
            }
        }
        if (debug){
            console.log("behaviourCount: " + behaviourCount);
        }
        //
        console.log("Loaded " + thisPony.name);
        thisPony.setCurrentBehaviour(thisPony.getRandomBehaviour());
        //make div
        jQuery("#root").append("<div class=\"ponyClass\" style=\"position:fixed;top:" + thisPony.positionY + "px;left:" + thisPony.positionX + "px\" id=\"pony-" + thisPony.nameNoSpace + "\"><img src=\"" + thisPony.currentGif + "\" alt=\"" + thisPony.name + "\"/></div>");
        //
        thisPony.intervalId = setInterval(function() {
            thisPony.updateTick();
        }, 25, 25);
    });
};

Pony.prototype.updateTick = function() {
    if (new Date().getTime() > this.timeToChangeBehaviour) {
        this.setCurrentBehaviour(this.getRandomBehaviour());
    }
    this.move(1.0);
};

Pony.prototype.move = function(/*double*/ delta) {
    this.positionY += ((Math.sin((-this.direction) * (Math.PI / 180))) * this.velocity) * delta;
    this.positionX += ((Math.cos((-this.direction) * (Math.PI / 180))) * this.velocity) * delta;

    if (this.limitAtEdge && !this.outsideWrap) {
        if (this.positionY > (window.innerHeight - this.height)) {
            this.positionY = (window.innerHeight - this.height) - 150;
            this.direction += 180;
            this.direction = this.direction % 360;
            this.refreshImageDirection();
            this.refreshGifDecoder();
            //console.log("Changed Direction ! " + this.direction + " (" + this.name + ")");
        }
        if (this.positionY < 0) {
            this.positionY = 1;
            this.direction += 180;
            this.direction = this.direction % 360;
            this.refreshImageDirection();
            this.refreshGifDecoder();
            //console.log("Changed Direction ! " + this.direction + " (" + this.name + ")");
        }
        if (this.positionX > (window.innerWidth - this.width)) {
            this.positionX = (window.innerWidth - this.width) - 1;
            this.direction += 180;
            this.direction = this.direction % 360;
            this.refreshImageDirection();
            this.refreshGifDecoder();
            //console.log("Changed Direction ! " + this.direction + " (" + this.name + ")");
        }
        if (this.positionX < 0) {
            this.positionX = 1;
            this.direction += 180;
            this.direction = this.direction % 360;
            this.refreshImageDirection();
            this.refreshGifDecoder();
            //console.log("Changed Direction ! " + this.direction + " (" + this.name + ")");
        }
    }

    //Redundant checks are redundant
    if (this.positionY > (window.innerHeight - this.height)) {
        this.positionY = (window.innerHeight - this.height) - 150;
    }
    if (this.positionX > (window.innerWidth - this.width)) {
        this.positionX = (window.innerWidth - this.width) - 150;
    }
    jQuery("#pony-" + this.nameNoSpace).attr("style", "position:fixed;left:" + this.positionX + "px;top:" + this.positionY + "px;");
    //$("#pony-Applejack").css("{position:fixed;left:150px;top:100px;}");
};

Pony.prototype.refreshGifDecoder = function() {
    if (this.imageRight) {
        this.currentGif = "assets/" + this.name + "/" + this.currentBehaviour.imageRight;
    } else {
        this.currentGif = "assets/" + this.name + "/" + this.currentBehaviour.imageLeft;
    }
    $("#pony-" + this.nameNoSpace + " img").attr("src", this.currentGif);
};

Pony.prototype.setCurrentBehaviour = function(/*Behaviour*/ behaviour) {
    this.currentBehaviour = behaviour;
    var delay = (this.currentBehaviour.maxDuration * 1000);
    if (delay > 15 * 1000) {
        delay = 15 * 1000;
    }
    this.timeToChangeBehaviour = new Date().getTime() + delay;
    this.velocity = this.currentBehaviour.movementSpeed /*/ 3.0*/; // to fix for 60fps istead of 10 fps.
    //set direction
    if (this.currentBehaviour.movementsAllowed.toLowerCase() === "none") {
        this.direction = (random.nextBoolean()) ? DIR_LEFT : DIR_RIGHT; //just for image!
    } else if (this.currentBehaviour.movementsAllowed.toLowerCase() === ("All")) {
        this.direction = random.nextFloat();
    } else if (this.currentBehaviour.movementsAllowed.toLowerCase() === ("horizontal_only")) {
        this.direction = (random.nextBoolean()) ? DIR_LEFT : DIR_RIGHT;
    } else if (this.currentBehaviour.movementsAllowed.toLowerCase() === ("vertical_only")) {
        this.direction = (random.nextBoolean()) ? DIR_UP : DIR_DOWN;
    } else if (this.currentBehaviour.movementsAllowed.toLowerCase() === ("horizontal_vertical")) {
        switch (random.nextInt(4)) {
            case 0:
                {
                    this.direction = DIR_LEFT;
                    break;
                }
            case 1:
                {
                    this.direction = DIR_UP;
                    break;
                }
            case 2:
                {
                    this.direction = DIR_RIGHT;
                    break;
                }
            case 3:
                {
                    this.direction = DIR_DOWN;
                    break;
                }
        }
    } else if (this.currentBehaviour.movementsAllowed.toLowerCase() === ("diagonal_only")) {
        switch (random.nextInt(4)) {
            case 0:
                {
                    this.direction = DIR_LEFT_UP;
                    break;
                }
            case 1:
                {
                    this.direction = DIR_LEFT_DOWN;
                    break;
                }
            case 2:
                {
                    this.direction = DIR_RIGHT_UP;
                    break;
                }
            case 3:
                {
                    this.direction = DIR_RIGHT_DOWN;
                    break;
                }
        }
    } else if (this.currentBehaviour.movementsAllowed.toLowerCase() === ("diagonal_horizontal")
            || this.currentBehaviour.movementsAllowed.toLowerCase() === ("diagonal_vertical")) {
        //just go with it. Trust me i'm a developer.
        this.direction = random.nextFloat();
    }
    this.refreshImageDirection();
};

Pony.prototype.refreshImageDirection = function() {
    if (this.direction > DIR_UP && this.direction < DIR_DOWN) { //right
        this.imageRight = false;
    } else {
        this.imageRight = true;
    }
    //this here?
    this.refreshGifDecoder();
};

Pony.prototype.getRandomBehaviour = function() {
    tempBehaviour = this.behaviours[Math.floor(Math.random() * this.behaviours.length)];
    return tempBehaviour;
};

/**
 * Behaviour Object
 */
function Behaviour() {
    /*String*/ this.name;
    /*String[]*/ this.line;
    /*float*/ this.probability; //0.1 - 1.0
    /*float*/ this.maxDuration;
    /*float*/ this.minDuration;
    /*float*/ this.movementSpeed; //pixels per 100ms, so calculate for current refresh rate!
    /*String*/ this.imageRight;
    /*String*/ this.imageLeft;
    /*String*/ this.movementsAllowed;
    this.intervalId;
}

Behaviour.prototype.init = function(/*String[]*/ line) {
    console.log("Behaviour.init");
    this.line = line;
    this.name = line[1];
    this.probability = parseFloat(line[2]);
    this.maxDuration = parseFloat(line[3]);
    this.minDuration = parseFloat(line[4]);
    this.movementSpeed = parseFloat(line[5]);
    this.imageRight = line[6];
    this.imageLeft = line[7];
    this.movementsAllowed = line[8];
};

/**
 * Random Object
 */
function MyRandom() {
}
MyRandom.prototype.nextBoolean = function() {
    return (Math.random() > 0.5);
};
MyRandom.prototype.nextFloat = function() {
    return (Math.random() * 360);
};
MyRandom.prototype.nextInt = function(max) {
    return Math.floor((Math.random() * max));
};


var mane6 = ["Applejack", "Twilight Sparkle", "Rainbow Dash", "Rarity", "Fluttershy", "Pinkie Pie"];

var listOfPonies = ["Ace",
    "Allie Way",
    "Aloe",
    "Angel",
    "Apple Bloom",
    "Apple Bumpkin",
    "Apple Fritter",
    "Applejack",
    "Applejack (Filly)",
    "Archer",
    "Beauty Brass",
    "Berry Punch",
    "Big Mac",
    "Big Macintosh",
    "Blinkie Pie",
    "Blossomforth",
    "Blues",
    "Bon-Bon",
    "Boxxy Brown",
    "Braeburn",
    "Caesar",
    "Candy Mane",
    "Caramel",
    "Carrot Top",
    "Changeling",
    "Cheerilee",
    "Cheerilee (80s)",
    "Cherry Berry",
    "Cloud Kicker",
    "Cloudchaser",
    "Clyde Pie",
    "Colgate",
    "Daisy",
    "Daring Do",
    "Davenport",
    "Derpy Hooves",
    "Diamond Mint",
    "Diamond Tiara",
    "Dinky Hooves",
    "Discord",
    "Doctor Whooves",
    "Doctor Whooves (Fan Character)",
    "Donny",
    "Donut Joe",
    "Dude",
    "Elsie",
    "Fancypants",
    "Fiddlesticks",
    "Fido",
    "Filthy Rich",
    "Flam",
    "Flash Sentry",
    "Fleur de lis",
    "Flim",
    "Flitter",
    "Fluttershy",
    "Fluttershy (Filly)",
    "Fredrick Horeshoepin",
    "Gilda",
    "Ginger Snap",
    "Granny Smith",
    "Gummy",
    "Gustave",
    "Hoity-Toity",
    "Horte Cuisine",
    "Inky Pie",
    "Iron Will",
    "King Sombra",
    "Lemon Hearts",
    "Lightning Bolt",
    "Lily",
    "Little Strongheart",
    "Lotus",
    "Lyra",
    "Manticore",
    "Master",
    "Mayor Mare",
    "Mjolna",
    "Mr Cake",
    "Mrs Cake",
    "Mrs Sparkle",
    "Mysterious Mare Do Well",
    "Nightmare Moon",
    "Nurse Redheart",
    "Octavia",
    "Opalescence",
    "Owlowiscious",
    "Parasprite",
    "Philomena",
    "Photo Finish",
    "Pinkamina Diane Pie",
    "Pinkie Pie",
    "Pinkie Pie (Filly)",
    "Pinkie Pie (Gala)",
    "Pipsqueak",
    "Pokey Pierce",
    "Prince Blueblood",
    "Princess Cadence",
    "Princess Cadence (Teenager)",
    "Princess Celestia",
    "Princess Celestia (Alternate Filly)",
    "Princess Celestia (Filly)",
    "Princess Luna",
    "Princess Luna (Filly)",
    "Princess Luna (Season 1)",
    "Princess Twilight Sparkle",
    "Queen Chrysalis",
    "Rainbow Dash",
    "Rainbow Dash (Filly)",
    "Rainbowshine",
    "Raindrops",
    "Random Pony",
    "Rarity",
    "Rarity (Filly)",
    "Rarity's Father",
    "Rarity's Mother",
    "Raven",
    "Roseluck",
    "Rover",
    "Royal Guard",
    "Royal Night Guard",
    "Ruby Pinch",
    "Rumble",
    "Sapphire Shores",
    "Scootaloo",
    "Screw Loose",
    "Screwball",
    "Sea Swirl",
    "Shadowbolt",
    "Sheriff Silverstar",
    "Shining Armour",
    "Silver Spoon",
    "Silverspeed",
    "Sindy",
    "Sir Colton Vines",
    "Snails",
    "Snips",
    "Snowflake",
    "Soarin'",
    "Soigne Folio",
    "Sparkler",
    "Spike",
    "Spitfire",
    "Spot",
    "Stella",
    "Steven Magnet",
    "Sue Pie",
    "Sunset Shimmer",
    "Surprise",
    "Sweetie Belle",
    "Tank",
    "Thunderlane",
    "Trixie",
    "Twilight Sparkle",
    "Twilight Sparkle (Filly)",
    "Twinkleshine",
    "Twist",
    "Uncle Orange",
    "Vinyl Scratch",
    "Violet",
    "Walter",
    "Wild Fire",
    "Winona",
    "Zecora"];




/////////////////////////////////////////////
/////////////////////////////////////////////
/////////////////////////////////////////////
/////////////////////////////////////////////




/* Copyright 2012-2013 Daniel Tillin
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * csvToArray v2.1 (Unminifiled for development)
 *
 * For documentation visit:
 * http://code.google.com/p/csv-to-array/
 *
 */
csvToArray = function (thisString, o) {
    console.log("thisString: " + thisString);
    console.log("csvToArray o="+o);
    var od = {
        'fSep': ',',
        'rSep': '\r\n',
        'quot': '"',
        'head': false,
        'trim': false
    }
    if (o) {
        for (var i in od) {
            if (!o[i]) o[i] = od[i];
        }
    } else {
        o = od;
    }
    var a = [
        ['']
    ];
    for (var r = f = p = q = 0; p < thisString.length; p++) {
        switch (c = thisString.charAt(p)) {
        case o.quot:
            if (q && thisString.charAt(p + 1) == o.quot) {
                a[r][f] += o.quot;
                ++p;
            } else {
                q ^= 1;
            }
            break;
        case o.fSep:
            if (!q) {
                if (o.trim) {
                    a[r][f] = a[r][f].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                }
                a[r][++f] = '';
            } else {
                a[r][f] += c;
            }
            break;
        case o.rSep.charAt(0):
            if (!q && (!o.rSep.charAt(1) || (o.rSep.charAt(1) && o.rSep.charAt(1) == thisString.charAt(p + 1)))) {
                if (o.trim) {
                    a[r][f] = a[r][f].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                }
                a[++r] = [''];
                a[r][f = 0] = '';
                if (o.rSep.charAt(1)) {
                    ++p;
                }
            } else {
                a[r][f] += c;
            }
            break;
        default:
            a[r][f] += c;
        }
    }
    if (o.head) {
        a.shift()
    }
    if (a[a.length - 1].length < a[0].length) {
        a.pop()
    }
    return a;
}