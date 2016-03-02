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
	new Point(5, 5),
	new Point(30, 30)
);

var slopeFieldSize = 0.5;

var drawMode = "diamonds";

function slopeField(p)
{
	p.draw = function()
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
			return Math.cos(x) * Math.sin(x*y/2);
			//return x/y;
			//return Math.cos(x/50 + xFuncOffset/3000) * Math.sin(x*y/94+xFuncOffset/60);
			//return -(x-xFuncOffset)/y;
		};
		
		function slopeAtPoint(x, y) {
			return _slopeAtPoint(x, y);
		}
		
		var resetCanvas = function()
		{
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

		resetCanvas();
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
	//var e = window.event || e;
	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
	e.preventDefault = true;
	
	if (e.shiftKey) {
		slopeFieldSize *= 1 - delta/10;
		processingInstance.draw();
		return false;
	}
	
	//$(canvas).width($(canvas).width() + delta * 6);
	if (delta > 0 && drawWindow.pMax.x - drawWindow.pMin.x < 0.001)
		return false;

	var midX = (drawWindow.pMax.x + drawWindow.pMin.x) / 2;
	var midY = (drawWindow.pMax.y + drawWindow.pMin.y) / 2;
	
	var sizeFactor = 1 - delta/10;
	var newWidth = drawWindow.width() * sizeFactor;
	var newHeight = drawWindow.height() * sizeFactor;
	
	drawWindow.pMin.x = midX - newWidth/2;
	drawWindow.pMin.y = midY - newHeight/2; 
	drawWindow.pMax.x = midX + newWidth/2;
	drawWindow.pMax.y = midY + newHeight/2;
	processingInstance.draw();
	//canvas.style.width = (canvas.width + delta*2) + "px";
	//alert(delta);
	
	
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
