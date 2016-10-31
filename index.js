var https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var dateformat = require('dateformat');
var fs = require('fs');

var app = express();

app.use(express.static('static'));
app.use(express.static('static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function startGcode(speed) {
	var comments = "(Automated Sprayer - " + (new Date()) + ")\n";
	var init = "G90 G94 G17 G21\n";
	var feedrate = "F" + speed + "\n";
	
	return comments + init + feedrate + "\n\n\n";
};

function writeMove(header, pos, file) {
	fs.write(file, header + " X" + pos[0] + " Y" + pos[1] + "\n");
}

function onePass(start, end, step, file) {
	fs.write(file, "(Starting Pass)\n");
	if (start[1] > end[1]) {
		step = -step;
	}
	
	var currPos = start.slice();
	var nextPos = [end[0], start[1]];
	
	writeMove("G1", currPos, file);
	
	while (Math.abs(currPos[1] - end[1]) >= Math.abs(step)) {
		writeMove("G1", nextPos, file);
		if (currPos[1] == nextPos[1]) {
			// Move Y
			currPos = nextPos.slice();
			nextPos[1] = nextPos[1] + step;
		} else {
			// Next move X
			currPos = nextPos.slice();
			if (nextPos[0] == start[0]) {
				nextPos[0] = end[0];
			} else {
				nextPos[0] = start[0];
			}
		}
	}
	
	fs.write(file, "(Finishing Pass)\n\n");
	return nextPos;
}



app.use('/api/gen', function(req, res) {
	var startX = parseFloat(req.body.startX),
			startY = parseFloat(req.body.startY),
			endX = parseFloat(req.body.endX),
			endY = parseFloat(req.body.endY),
			spacing = parseFloat(req.body.spacing),
			passes = parseInt(req.body.passes),
			speed = parseInt(req.body.speed);

	var filename = "gcode/sprayer_" + dateformat(new Date(), 'dmyyyy_h_MM_s') + ".nc";
	
	fs.open(filename, "w", function(err,fd) {
		if (err) {
			console.log("could not open " + filename);
		}
		fs.write(fd, startGcode(speed));		
		
		for (var i = 0; i < passes; i++) {
			var ret = onePass([startX,startY], [endX,endY], spacing, fd);
			i++;
			if (i < passes) {
				if (ret[0] == startX)
					ret[0] = endX;
				onePass(ret, [startX,startY], spacing, fd);
			}
		}
	
	});
	
	
	return res.send({filename:"/" + filename});
	
});

app.get("/gcode/:name", function (req, res) {
	console.log(req.params.name);
	res.download("gcode/" + req.params.name, function(err) {
		if (!err) {
			fs.unlink("gcode/" + req.params.name);
		}
	});
	
});

app.listen(8080);
