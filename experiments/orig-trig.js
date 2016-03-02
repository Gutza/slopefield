function slopeField(p)
{
	var i;

	p.size(680, 680);
	
	//You'll get a better approximation the smaller the xStep (although it will require more computation)
	var xStep = 1;
	var xFuncOffset = 0;
	var drawGrid = false;

	//Initial conditions
	var initX = 0;
	var initY = 15;

	//This is where you should define the first-order differential equation
	//Assumes it can be expressed as y' = f(x, y(x))
	var _slopeAtPoint = function(x, y) {
		return Math.cos(x/50 + xFuncOffset/3000) * Math.sin(x*y/94+xFuncOffset/60);
		//return -(x-xFuncOffset)/y;
	};
	
	function slopeAtPoint(x, y) {
		return _slopeAtPoint(x, y);
	}

	//Variables for graph paper
	var xMin = 5;
	var yMin = 5;

	var xMax = 30;
	var yMax = 30;

	var xOffset = 20;
	var yOffset = 20;

	var xScale = (p.width - 2 * xOffset) / (xMax-xMin);
	var yScale = xScale;

	//Maps an x coordinate to the appropriate pixeldistance on canvas
	var xCoordinate = function(x) {
		return xOffset + (x-xMin) * xScale;
	};

	//Maps a y coordinate to the appropriate pixel distance on canvas
	var yCoordinate = function (y) {
		return  p.height-((y-yMin)*yScale+ yOffset);
	};

	var slopeFieldSize = 1.0;

	var resetCanvas = function() {
		p.background(58, 66, 74);
		
		// Draw slope field
		//p.stroke(207, 207, 207);
		for (var x = xMin; x <= xMax; x++) {
			for (var y = yMin; y <= yMax; y++) {
				var slope = slopeAtPoint(x, y);
				var ang = Math.atan(slope);
				var angPerp = ang + Math.PI / 2;
				
				var asin = Math.sin(ang);
				var acos = Math.cos(ang);
				var apsin = Math.sin(angPerp);
				var apcos = Math.cos(angPerp);
				
				var longFact = slopeFieldSize / 2;
				var shortFact = slopeFieldSize / 8;
				
				p.noStroke();

				p.fill(70, 140, 70);
				p.quad(
					xCoordinate(x - apcos * longFact), yCoordinate(y - apsin * longFact),
					xCoordinate(x - acos * shortFact), yCoordinate(y - asin * shortFact),
					xCoordinate(x + apcos * longFact), yCoordinate(y + apsin * longFact),
					xCoordinate(x + acos * shortFact), yCoordinate(y + asin * shortFact)
				);

				p.fill(255);
				p.quad(
					xCoordinate(x - acos * longFact), yCoordinate(y - asin * longFact),
					xCoordinate(x - apcos * shortFact), yCoordinate(y - apsin * shortFact),
					xCoordinate(x + acos * longFact), yCoordinate(y + asin * longFact),
					xCoordinate(x + apcos * shortFact), yCoordinate(y + apsin * shortFact)
				);
				
				/*
				var witnessFact = longFact * 1.5;
				p.strokeWeight(2);
				p.stroke(255, 0, 0);
				p.line(xCoordinate(x), yCoordinate(y), xCoordinate(x + acos * witnessFact), yCoordinate(y + asin * witnessFact));
				p.stroke(0, 0, 255);
				p.line(xCoordinate(x), yCoordinate(y), xCoordinate(x + apcos * witnessFact), yCoordinate(y + apsin * witnessFact));
				*/
			}
		}
		
		if (drawGrid) {
			p.strokeWeight(1);
			p.stroke(250, 250, 250);
			//Draw the verticals lines in grid and labels x-axis with numbers
			for(var i=xMin; i<=xMax; i++) {
				line(xCoordinate(i), yCoordinate(yMax), xCoordinate(i), yCoordinate(yMin));
				text(i, xCoordinate(i), yCoordinate(yMin)+15);
			}
			
			//Draw the horizontal lines in grid and labels y-axis with numbers
			for(var i=yMin; i<=yMax; i++) {
				line(xCoordinate(xMin), yCoordinate(i), xCoordinate(xMax), yCoordinate(i));
				text(i, xOffset/2, 400-(i*yScale+ yOffset));
			}
		}
	};

	resetCanvas();
}

var canvas = document.getElementById("canvas");
var processingInstance = new Processing(canvas, slopeField);
