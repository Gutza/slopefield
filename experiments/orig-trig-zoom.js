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

var drawWindow = new ViewWindow(
	new Point(-5, -5),
	new Point(5, 5)
);

var slopeFieldSize = 0.25;

var drawMode = "diamonds";
var enableEuler = true;
var eulerStep = 0.1;

function slopeField(p)
{
	p.draw = function()
	{
		var i;

		p.size(680, 680);
		
		var xFuncOffset = 0;

		//Initial conditions
		var initX = 0;
		var initY = 15;

		//This is where you should define the first-order differential equation
		//Assumes it can be expressed as y' = f(x, y(x))
		var _slopeAtPoint = function(x, y) {
			//return -x/y;
			//return Math.sin(x) * y * y;
			//return x*x - x - 2;
			return Math.cos(x) * Math.sin(x*y/2);
			//return x*x*x/y;
			//return Math.cos(x/50 + xFuncOffset/3000) * Math.sin(x*y/94+xFuncOffset/60);
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
			if (drawMode == "diamonds") {
				p.fill(200);
				p.noStroke();
			} else if (drawMode == "lines") {
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
					
					if (drawMode == "diamonds") {
						p.quad(
							xCoordinate(x - acos * longFact), yCoordinate(y - asin * longFact),
							xCoordinate(x - apcos * shortFact), yCoordinate(y - apsin * shortFact),
							xCoordinate(x + acos * longFact), yCoordinate(y + asin * longFact),
							xCoordinate(x + apcos * shortFact), yCoordinate(y + apsin * shortFact)
						);
					} else if (drawMode == "lines") {
						p.line(
							xCoordinate(x - acos * longFact), yCoordinate(y - asin * longFact),
							xCoordinate(x + acos * longFact), yCoordinate(y + asin * longFact)
						);
					}
				}
			}

			p.fill(255, 0, 0);
			p.text("["+drawWindow.pMin.x.toFixed(2)+".."+drawWindow.pMax.x.toFixed(2)+", "+drawWindow.pMin.y.toFixed(2)+".."+drawWindow.pMax.y.toFixed(2)+"]", 10, 20);

		};

		function drawEuler()
		{
			if (!enableEuler)
				return;
			
			p.strokeWeight(2);
			p.stroke(210, 0, 0);
			
			for (var y = drawWindow.pMin.y; y <= drawWindow.pMax.y; y += slopeFieldSize) {
				var cx = drawWindow.pMin.x;
				var cy = y;
				while (cx >= drawWindow.pMin.x && cx <= drawWindow.pMax.x && cy >= drawWindow.pMin.y && cy <= drawWindow.pMax.y) {
					var slope = slopeAtPoint(cx, cy);
					var ang = Math.atan(slope);
					var nx = cx + eulerStep * Math.cos(ang);
					var ny = cy + eulerStep * Math.sin(ang);
					p.line(xCoordinate(cx), yCoordinate(cy), xCoordinate(nx), yCoordinate(ny));
					cx = nx;
					cy = ny;
				}
			}
		}
		
		resetCanvas();
		drawEuler();
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
canvas.addEventListener("mouseenter", EvEnter, false);
canvas.addEventListener("mouseleave", EvLeave, false);


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
	enableEuler = false;
	dragging = true;
	dragStartMouse = MousePos(e);
	dragStartWindow = drawWindow.clone();
	drawMode = "lines";
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
	drawMode = "diamonds";
	enableEuler = true;
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
