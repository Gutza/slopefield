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
			return Math.cos(x/50 + xFuncOffset/3000) * Math.sin(x*y/94+xFuncOffset/60);
			//return -(x-xFuncOffset)/y;
		};
		
		function slopeAtPoint(x, y) {
			return _slopeAtPoint(x, y);
		}
		
		var resetCanvas = function()
		{
			//Variables for graph paper
			var xOffset = p.width / (drawWindow.pMax.x - drawWindow.pMin.x) / 2;
			var yOffset = p.height / (drawWindow.pMax.y - drawWindow.pMin.y) / 2;

			var xScale = (p.width - 2 * xOffset) / (drawWindow.pMax.x-drawWindow.pMin.x);
			var yScale = xScale;

			//Maps an x coordinate to the appropriate pixeldistance on canvas
			var xCoordinate = function(x) {
				return xOffset + (x-drawWindow.pMin.x) * xScale;
			};

			//Maps a y coordinate to the appropriate pixel distance on canvas
			var yCoordinate = function (y) {
				return  p.height-((y-drawWindow.pMin.y)*yScale+ yOffset);
			};

			var slopeFieldSize = 1.0;

			p.background(58, 66, 74);
			
			// Draw slope field
			if (drawMode == "diamonds") {
				p.fill(200);
				p.noStroke();
			} else if (drawMode == "lines") {
				p.strokeWeight(1);
				p.stroke(200);
			}
			for (var x = drawWindow.pMin.x; x <= drawWindow.pMax.x + 1; x++) {
				for (var y = drawWindow.pMin.y; y <= drawWindow.pMax.y + 1; y++) {
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

	var xMin = 5;
	var yMin = 5;

	var xMax = 30;
	var yMax = 30;
 
	var canvas = document.getElementById("canvas");
	var processingInstance = new Processing(canvas, slopeField);
	processingInstance.draw();
	
	canvas.addEventListener('mousewheel', EvLis, false);
	canvas.addEventListener("DOMMouseScroll", EvLis, false);
	canvas.addEventListener("mouseup", EvUp, false);
	canvas.addEventListener("mouseout", EvUp, false);
	canvas.addEventListener("mousemove", EvMove, false);
	canvas.addEventListener("mousedown", EvDown, false);

	function EvLis(e)
	{
		//var e = window.event || e;
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		e.preventDefault = true;
		//$(canvas).width($(canvas).width() + delta * 6);
		if (delta > 0 && drawWindow.pMax.x - drawWindow.pMin.x < 4)
			return false;

		drawWindow.pMin.x += delta;
		drawWindow.pMin.y += delta; 
		drawWindow.pMax.x -= delta;
		drawWindow.pMax.y -= delta;
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
		
		var stat = "";
		
		if (e.ctrlKey)
			stat += "+CTRL";
		if (e.shiftKey)
			stat += "+SHIFT";
		
		console.log("Mod: "+stat);
		
		var currMousePos = MousePos(e);
		var deltaFactor = canvas.width / dragStartWindow.width();
		var xDelta = (currMousePos.x - dragStartMouse.x) / deltaFactor;
		var yDelta = (currMousePos.y - dragStartMouse.y) / deltaFactor;
		
		drawWindow.pMin.x = dragStartWindow.pMin.x - xDelta;
		drawWindow.pMax.x = dragStartWindow.pMax.x - xDelta;

		drawWindow.pMin.y = dragStartWindow.pMin.y + yDelta;
		drawWindow.pMax.y = dragStartWindow.pMax.y + yDelta;
		
		//console.log("xDelta = "+xDelta + "; dSW.pMin.x = "+dragStartWindow.pMin.x);
		
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
