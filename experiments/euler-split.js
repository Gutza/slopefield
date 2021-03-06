function Point(x, y)
{
	this.x = x;
	this.y = y;
	
	this.clone = function()
	{
		return new Point(this.x, this.y);
	}
}

function ViewWindow(pMin, pMax)
{
	this.pMin = pMin;
	this.pMax = pMax;
	
	this.width = function()
	{
		return pMax.x - pMin.x;
	}
	
	this.height = function()
	{
		return pMax.y - pMin.y;
	}
	
	this.clone = function()
	{
		return new ViewWindow(this.pMin.clone(), this.pMax.clone());
	}
}

function Step(fineId, fine, coarseId, coarse)
{
	this.setFine = function()
	{
		this.nominal = this.fine;
	}
	
	this.setCoarse = function()
	{
		this.nominal = this.coarse;
	}
	
	this.fromValues = function(values)
	{
		this.fine = values[0];
		this.coarse = values[1];
		this.setFine();
		this.updateText();
	}
	
	this.updateText = function()
	{
		this.fineEl.text(this.fine);
		this.coarseEl.text(this.coarse);
	}

	this.fine = fine;
	this.coarse = coarse;
	this.nominal = fine; // default
	
	this.fineEl = $("#" + fineId);
	this.coarseEl = $("#" + coarseId);
	
	this.updateText();
}

var drawWindow = new ViewWindow(
	new Point(-5, -5),
	new Point(5, 5)
);

var slopeFieldSize = 0.5;

var quiverDrawEnabled = false;
var quiverDrawMode = "diamonds";

var eulerStep = new Step("eulerFine", 0.1, "eulerCoarse", 0.2);
var enableEuler = true;

var splitStep = new Step("splitFine", 0.5, "splitCoarse", 1.0);
var enableSplit = true;

function slopeField(p)
{
	p.draw = function()
	{
		var i;

		p.size(680, 680);
		
		//Initial conditions
		var initX = 0;
		var initY = 15;

		//This is where you should define the first-order differential equation
		//Assumes it can be expressed as y' = f(x, y(x))
		var _slopeAtPoint = function(x, y) {
			//return -x/y;
			//return Math.sin(x) * y * y;
			//return x*x - x - 2;
			//return Math.cos(x) * Math.sin(x*y/2);
			//return x*x*x/y;
			return Math.cos(x) * Math.sin(x*y/2);
			//return -(x-xFuncOffset)/y;
		};
		
		function slopeAtPoint(x, y) {
			return _slopeAtPoint(x, y);
		}
		
			//Variables for graph paper
			var xScale = p.width / drawWindow.width();
			var yScale = xScale;

			//Maps an x coordinate to the appropriate pixeldistance on canvas
			var xCoordinate = function(x) {
				return (x-drawWindow.pMin.x) * xScale;
			};

			//Maps a y coordinate to the appropriate pixel distance on canvas
			var yCoordinate = function (y) {
				return  p.height-((y-drawWindow.pMin.y)*yScale);
			};


		var resetCanvas = function()
		{
			p.background(58, 66, 74);
			
			// Draw slope field
			if (quiverDrawEnabled) {
				if (quiverDrawMode == "diamonds") {
					p.fill(200);
					p.noStroke();
				} else if (quiverDrawMode == "lines") {
					p.strokeWeight(1);
					p.stroke(200);
				}
				for (var x = drawWindow.pMin.x; x <= drawWindow.pMax.x; x += slopeFieldSize) {
					for (var y = drawWindow.pMin.y; y <= drawWindow.pMax.y; y += slopeFieldSize) {
						var slope = slopeAtPoint(x, y);
						var ang = Math.atan(slope);
						var angPerp = ang + Math.PI / 2;
						
						var asin = Math.sin(ang);
						var acos = Math.cos(ang);
						var apsin = Math.sin(angPerp);
						var apcos = Math.cos(angPerp);
						
						var longFact = slopeFieldSize / 2;
						var shortFact = slopeFieldSize / 8;
						
						if (quiverDrawMode == "diamonds") {
							p.quad(
								xCoordinate(x - acos * longFact), yCoordinate(y - asin * longFact),
								xCoordinate(x - apcos * shortFact), yCoordinate(y - apsin * shortFact),
								xCoordinate(x + acos * longFact), yCoordinate(y + asin * longFact),
								xCoordinate(x + apcos * shortFact), yCoordinate(y + apsin * shortFact)
							);
						} else if (quiverDrawMode == "lines") {
							p.line(
								xCoordinate(x - acos * longFact), yCoordinate(y - asin * longFact),
								xCoordinate(x + acos * longFact), yCoordinate(y + asin * longFact)
							);
						}
					}
				}
			}
		};

		function drawSolutions()
		{
			if (!enableEuler)
				return;
			
			for (var y = drawWindow.pMin.y; y <= drawWindow.pMax.y; y += slopeFieldSize) {
				for (var direction = 0; direction < 4; direction += Math.PI) {
					var cx = drawWindow.pMin.x + drawWindow.width() / 2;
					var cy = y;
					
					p.strokeWeight(3);
					p.stroke(38, 46, 84);
					drawSplit(cx, cy, 0.1, direction);

					p.strokeWeight(1);
					if (enableEuler) {
						p.stroke(210, 0, 0);
						drawEuler(cx, cy, eulerStep.nominal, direction);
					}
					
					if (enableSplit) {
						p.stroke(0, 210, 0);
						drawSplit(cx, cy, splitStep.nominal, direction);
					}
										
					p.stroke(210, 210, 210);
					p.noFill();
					p.ellipse(xCoordinate(cx), yCoordinate(cy), 5, 5);
				}
			}
			
			p.fill(155, 155, 155);
			p.text("["+drawWindow.pMin.x.toFixed(2)+".."+drawWindow.pMax.x.toFixed(2)+", "+drawWindow.pMin.y.toFixed(2)+".."+drawWindow.pMax.y.toFixed(2)+"] / " + slopeFieldSize.toFixed(2), 5, 15);
		}
		
		function inBounds(x, y)
		{
			return x >= drawWindow.pMin.x && x <= drawWindow.pMax.x && y >= drawWindow.pMin.y && y <= drawWindow.pMax.y;
		}

		function drawEuler(xStart, yStart, step, direction)
		{
			var cx = xStart;
			var cy = yStart;
			while (inBounds(cx, cy)) {
				var slope = slopeAtPoint(cx, cy);
				var ang = Math.atan(slope) + direction;
				var nx = cx + step * Math.cos(ang);
				var ny = cy + step * Math.sin(ang);
				p.line(xCoordinate(cx), yCoordinate(cy), xCoordinate(nx), yCoordinate(ny));
				cx = nx;
				cy = ny;
			}
		}
		
		function drawSplit(xStart, yStart, step, direction)
		{
			var cx = xStart;
			var cy = yStart;
			while (inBounds(cx, cy)) {
				var slope1 = slopeAtPoint(cx, cy);
				var ang = Math.atan(slope1) + direction;
				var nx = cx + step * Math.cos(ang);
				var ny = cy + step * Math.sin(ang);
				
				var slope2 = slopeAtPoint(nx, ny);
				var slopeAvg = (slope1 + slope2) / 2;
				
				angAvg = Math.atan(slopeAvg) + direction;
				var ax = cx + step * Math.cos(angAvg);
				var ay = cy + step * Math.sin(angAvg);
				
				p.line(xCoordinate(cx), yCoordinate(cy), xCoordinate(ax), yCoordinate(ay));
				cx = ax;
				cy = ay;
			}
		}
		
		resetCanvas();
		drawSolutions();
	}
}

var canvas = document.getElementById("canvas");
var processingInstance = new Processing(canvas, slopeField);
processingInstance.draw();

canvas.addEventListener('mousewheel', EvScroll, false);
canvas.addEventListener("DOMMouseScroll", EvScroll, false);
canvas.addEventListener("mouseup", EvUp, false);
canvas.addEventListener("mouseout", EvUp, false);
canvas.addEventListener("mousemove", EvMove, false);
canvas.addEventListener("mousedown", EvDown, false);
$("#mainContainer").on("mouseenter", EvEnter);
$("#mainContainer").on("mouseleave", EvLeave);

$(".slider").slider({
	range: true,
	values: [ 0, 1 ],
	min: 0.05,
	max: 1,
	step: 0.01,
	slide: stepChange,
});
$("#eulerStep").slider("option", "values", [eulerStep.fine, eulerStep.coarse]);
$("#splitStep").slider("option", "values", [splitStep.fine, splitStep.coarse]);

function stepChange(ev, ui)
{
	var vals = ui.values; // both values, min and max (fine and coarse)
	switch(ev.target.id) {
		case "eulerStep":
			eulerStep.fromValues(ui.values);
			break;
		case "splitStep":
			splitStep.fromValues(ui.values);
			break;
		default:
			alert("Unknown slider!");
	}
	processingInstance.draw();
}

function EvScroll(e)
{
	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
	e.preventDefault = true;
	
	if (e.shiftKey) {
		slopeFieldSize *= 1 - delta/10;
		processingInstance.draw();
		return false;
	}
	
	if (delta > 0 && drawWindow.pMax.x - drawWindow.pMin.x < 0.001)
		return false;

	var mousePos = MousePos(e);
	var offXfract = mousePos.x / canvas.width;
	var offYfract = 1 - mousePos.y / canvas.height;
	
	var sizeFactor = delta/10;
	
	drawWindow.pMin.x = drawWindow.pMin.x + drawWindow.width() * sizeFactor * offXfract;
	drawWindow.pMin.y = drawWindow.pMin.y + drawWindow.height() * sizeFactor * offYfract;
	drawWindow.pMax.x = drawWindow.pMax.x - drawWindow.width() * sizeFactor * (1 - offXfract);
	drawWindow.pMax.y = drawWindow.pMax.y - drawWindow.height() * sizeFactor * (1 - offYfract);
	
	processingInstance.draw();
	
	return false; 
}

var dragging = false;
var dragStartMouse = {};
var dragStartWindow;

function EvDown(e)
{
	dragging = true;
	dragStartMouse = MousePos(e);
	dragStartWindow = drawWindow.clone();
	quiverDrawMode = "lines";
	
	if (quiverDrawEnabled)
		enableEuler = false;
	else {
		eulerStep.setCoarse();
		splitStep.setCoarse();
	}
	
	processingInstance.draw();
}

function EvMove(e)
{
	if (!dragging)
		return;
	
	var currMousePos = MousePos(e);
	var deltaFactor = canvas.width / dragStartWindow.width();
	var xDelta = (currMousePos.x - dragStartMouse.x) / deltaFactor;
	var yDelta = (currMousePos.y - dragStartMouse.y) / deltaFactor;
	
	drawWindow.pMin.x = dragStartWindow.pMin.x - xDelta;
	drawWindow.pMax.x = dragStartWindow.pMax.x - xDelta;

	drawWindow.pMin.y = dragStartWindow.pMin.y + yDelta;
	drawWindow.pMax.y = dragStartWindow.pMax.y + yDelta;
	
	processingInstance.draw();
}

function EvUp(e)
{
	dragging = false;
	quiverDrawMode = "diamonds";
	enableEuler = true;
	eulerStep.setFine();
	splitStep.setFine();
	processingInstance.draw();
}

function MousePos(event)
{
	event = (event ? event : window.event);
	return new Point(
		event.pageX - canvas.offsetLeft,
		event.pageY - canvas.offsetTop
	);
}

function EvEnter(e)
{
	$('body').css('overflow', 'hidden');
}

function EvLeave(e)
{
	$('body').css('overflow', 'auto');
}

$.key('q', function(){
  quiverDrawEnabled = !quiverDrawEnabled;
  processingInstance.draw();
  return false;
});