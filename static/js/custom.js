(function($) {
'use strict';

var margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;


var svg = d3.select("#graph")
		.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



function drawCircle(x, y, size, color) {
		svg.append("circle")
			.attr("cx", x)
			.attr("cy", y)
			.attr("r", size)
			.style("fill", color);
}

function drawRect(coords) {
	svg.append("rect")
		.attr("x", Math.min(coords[0][0], coords[1][0]))
		.attr("y", Math.min(coords[0][1], coords[1][1]))
		.attr("width", Math.abs(coords[1][0] - coords[0][0]))
		.attr("height", Math.abs(coords[1][1] - coords[0][1]))
		.attr("class", "bound")
		.style("stroke-dasharray", ("3, 3"));
	d3.select("#area").text("Spray Area: " 
		+ Math.round((Math.abs(coords[1][0] - coords[0][0]) * 250 / width) *100) /100 + " mm by "
		+ Math.round(Math.abs(coords[1][1] - coords[0][1]) * 250 / height * 100) / 100 + " mm");
}

function drawLine(coords, color, cla) {
	svg.append("line")
		.attr("x1", coords[0][0])
		.attr("x2", coords[1][0])
		.attr("y1", coords[0][1])
		.attr("y2", coords[1][1])
		.attr("class", "line")
		.style("stroke", color)
		.attr("class", cla);
}

function drawToolPath(coords, step) {
	var currXY = coords[0];
	var nextXY = [coords[1][0],currXY[1]];
	step = step * width / 250;

	drawRect(coords);
	
	if (coords[0][1] > coords[1][1]) {
		step = -step;
	}

	while (Math.abs(currXY[1] - coords[1][1]) >= Math.abs(step)) {
		drawLine([currXY,nextXY], "red", "toolpath");
		drawLine([nextXY, [nextXY[0], nextXY[1] + step]], "red", "toolpath");
		var oldX = currXY[0];
		currXY = [nextXY[0], nextXY[1] + step];
		nextXY = [oldX, currXY[1]];
	}

	drawLine([currXY, nextXY], "red", "toolpath");

}

function clearToolPath() {
	svg.selectAll(".toolpath").remove();
}

var rectangle = svg.append("rect")
.attr("x", 0)
.attr("y", 0)
.attr("width", width)
.attr("height", width)
.style("stroke", "black")
.style("fill", "white")
.style("stroke-width", 1);


// Global Variables
var spacing = 10;
var passes = 1;
var speed = 10000;
var globCoords = [[-1,-1], [-1,-1]];

// Event Handlers
rectangle.on("click", function() {
    var coords = d3.mouse(this);
		console.log(coords);
		if (globCoords[0][0] == -1) {
			globCoords[0] = coords;
			drawCircle(coords[0], coords[1], 4, "green");
		} else if (globCoords[1][0] == -1) {
			globCoords[1] = coords;
			drawCircle(coords[0], coords[1], 4, "red");
			drawToolPath(globCoords, spacing);
		} else {
			globCoords[0] = coords;
			globCoords[1] = [-1,-1];
			d3.selectAll("circle").remove();
			d3.selectAll(".bound").remove();
			clearToolPath();
			drawCircle(coords[0], coords[1], 4, "green");
		}

});

$("#spacing").on("input", function() {
	var inSpacing = document.getElementById("spacing").value;
	if (inSpacing != null && parseFloat(inSpacing) != NaN) {
		inSpacing = parseFloat(inSpacing);
	} else {
		inSpacing = 10;
	}
	if (inSpacing <= 0) {
		inSpacing = 10;
	}
	spacing = inSpacing;
	clearToolPath();
	drawToolPath(globCoords, inSpacing);
		
});

$("#passes").on("input", function() {
	var currPasses = document.getElementById("passes").value;
	if (currPasses != null && parseInt(currPasses) != NaN) {
		currPasses = parseInt(currPasses);
	}
	
	if (currPasses > 0) {
		passes = currPasses;
	}
});

$("#speed").on("input", function() {
	var currSpeed = document.getElementById("speed").value;
	if (currSpeed != null && parseInt(currSpeed) != NaN) {
		currSpeed = parseInt(currSpeed);
	}
	
	if (currSpeed > 0) {
		speed = currSpeed;
	}
});


$(document).on("keypress", "input", function (e) {
    var code = e.keyCode || e.which;
    if (code == 13) {
        e.preventDefault();
        return false;
    }
});

$("#generate").on("click", function(e) {
	e.preventDefault();
	if (globCoords[1][0] > 0) {
		$.ajax({
			url: "/api/gen",
			type: "POST",
			data: {
				"startX": globCoords[0][0] * 250 / width,
				"startY": 250 - globCoords[0][1] * 250 / width,
				"endX": globCoords[1][0] * 250 / width,
				"endY": 250 - globCoords[1][1] * 250 / width,
				"spacing": spacing,
				"passes": passes,
				"speed": speed
			}
		}).done(function(data) {
				window.location = data.filename;
			});
	}
});


})(jQuery);
