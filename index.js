var express = require('express');
var bodyParser = require("body-parser")
var gpio = require('gpio');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var redPin = 21,
    yellowPin = 16,
    greenPin = 20;
var port = 3000;
var states = { red: 0, yellow: 0, green: 0 };
var last = 0
var cycle = function(color, frequency, millis, current) {
    if (current) {
        color.reset();
    } else {
        color.set();
    }
    millis -= frequency;
    if (millis > 0) {
        setTimeout(function() { cycle(color, frequency, millis, current ? 0 : 1) }, frequency);
    } else {
        green.set();
        yellow.set();
        red.set();
    }
}
var green = gpio.export(greenPin, {
    direction: "out",
    ready: function() {
        green.set();
        green.on("change", function(val) {
            states.green = val ? 0 : 1;
        })
    }
});
var yellow = gpio.export(yellowPin, {
    direction: "out",
    ready: function() {
        yellow.set();
        yellow.on("change", function(val) {
            states.yellow = val ? 0 : 1;
        })
    }
});
var red = gpio.export(redPin, {
    direction: "out",
    ready: function() {
        red.set();
        red.on("change", function(val) {
            states.red = val ? 0 : 1;
        })
    }
});
app.all('/:light/:power', function(req, res) {
    lightPower(req.params.light, req.params.power, req.query.frequency, req.query.millis);
    res.jsonp(null);
});
app.get('/states', function(req, res) {
    res.jsonp(states);
});
app.post('/slack', function(req, res) {
    var text = req.body.text.replace("light ", "").split(" ")
    if (text[0] === "hammertime" || (text[0] === "hammer" && text[1] === "time")) {
        lightPower("red", "just", "47", "2000");
        lightPower("yellow", "just", "48", "2000");
        lightPower("green", "just", "49", "2000");
    } else {
        lightPower(text[0], text[1], null, null);
    }
});
var port = 3000;
app.listen(port, function() {
    console.log('Arkalight listening on port ' + port + "!");
});

function lightPower(light, power, frequency, millis) {
    last = Date.now();
    if (light === "all") {

        if (power === "on") {
            red.reset();
            green.reset();
            yellow.reset();
        } else if (power === "off") {
            red.set();
            green.set();
            yellow.set();
        }
    } else {
        let pickedLight = light === "green" ? green : (light === "yellow" ? yellow : (light === "red" ? red : null))
        if (power === "on") {
            pickedLight.reset();
        } else if (power === "off") {
            pickedLight.set();
        } else if (power === "just") {
            pickedLight !== red ? red.set() : red.reset();
            pickedLight !== yellow ? yellow.set() : yellow.reset();
            pickedLight !== green ? green.set() : green.reset();
            pickedLight.reset();
            if (frequency && millis) {
                setTimeout(function() {
                    cycle(pickedLight, frequency, millis);
                }, frequency);
            }
        }
    }
}
setInterval(function() {
    var current = Date.now();
    console.log("Interval for shutoff");
    console.log("Current: "+current);
    console.log("Last: "+last);

    if (current - last > 600000) {
        console.log("Shutoff!!")
        lightPower("all", "off");
    }
}, 30000)
