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

function ButcherTableau(s)
{
	this.s = s; // The size of the tableau
	
	// The a11..ass coefficient array
	this.a = new Array(s);
	
	// The b1...bs coefficient vector (higher order)
	this.b = new Array(s);
	
	// The b*1...b*s coefficient vector (lower order)
	this.bs = new Array(s);
	
	// The c1...cs coefficient vector
	this.c = new Array(s);
	
	// Initialize all coefficient vectors
	for (var i = 0; i < s; i++) {
		this.a[i] = new Array(s);
		for (var j = 0; j < s; j++) {
			this.a[i][j] = 0;
		}
		
		this.b[i] = 0;
		this.bs[i] = 0;
		this.c[i] = 0;
	}
}

var drawWindow = new ViewWindow(
	new Point(-5, -5),
	new Point(5, 5)
);

var slopeFieldSize = 0.5;

var quiverDrawEnabled = false;
var quiverDrawMode = "diamonds";

var eulerStep = new Step("eulerFine", 0.05, "eulerCoarse", 0.2);
var eulerEnabled = true;
var eulerTableau = new ButcherTableau(1);
eulerTableau.b[0] = 1;

var heunStep = new Step("heunFine", 0.05, "heunCoarse", 0.2);
var heunEnabled = true;
var heunTableau = new ButcherTableau(2);
heunTableau.a[1][0] = 1;
heunTableau.b = [0.5, 0.5];
heunTableau.c[1] = 1;

var rk4Tableau = new ButcherTableau(4);
rk4Tableau.a[1][0] = 0.5;
rk4Tableau.a[2][1] = 0.5;
rk4Tableau.a[3][2] = 1;

rk4Tableau.a = [
    [  0,   0,   0],
	[1/2,   0,   0],
	[  0, 1/2,   0],
	[  0,   0,   1],
];
rk4Tableau.b = [1/6, 1/3, 1/3, 1/6];
rk4Tableau.c = [
	  0,
	1/2,
	1/2,
	  1
];

var tableauHeunEuler = new ButcherTableau(2);
tableauHeunEuler.a = [
	[0, 0],
	[1, 0],
];
tableauHeunEuler.b =  [1/2, 1/2]; // Higher order (Heun)
tableauHeunEuler.bs = [  1,   0]; // Lower order (Euler)
tableauHeunEuler.c = [
	0,
	1,
];

var tableauBogackiShampine = new ButcherTableau(4);
tableauBogackiShampine.a = [
	[  0,   0,   0,   0],
	[1/2,   0,   0,   0],
	[  0, 3/4,   0,   0],
	[2/9, 1/3, 4/9,   0],
];
tableauBogackiShampine.b =  [7/24, 1/4, 1/3, 1/8];
tableauBogackiShampine.bs = [ 2/9, 1/3, 4/9,   0];
tableauBogackiShampine.c = [
	  0,
	1/2,
	3/4,
	  1,
];

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
			var heunErrorSquared = heunStep.nominal * heunStep.nominal;
			var eulerErrorSquared = eulerStep.nominal * eulerStep.nominal;
			
			for (var y = drawWindow.pMin.y; y <= drawWindow.pMax.y; y += slopeFieldSize) {
				for (var direction = 0; direction < 4; direction += Math.PI) {
					var cPoint = new Point(drawWindow.pMin.x + drawWindow.width() / 2, y);
					
					p.strokeWeight(3);
					p.stroke(38, 46, 84);
					drawRungeKutta(rk4Tableau, cPoint, 0.1, direction);

					p.strokeWeight(1);
					if (heunEnabled) {
						p.stroke(0, 210, 0);
						drawRKE(tableauHeunEuler, cPoint, heunStep.nominal, heunErrorSquared, direction);
					}

					if (eulerEnabled) {
						p.stroke(210, 0, 0);
						drawRKE(tableauBogackiShampine, cPoint, eulerStep.nominal, eulerErrorSquared, direction);
					}

					p.stroke(210, 210, 210);
					p.noFill();
					p.ellipse(xCoordinate(cPoint.x), yCoordinate(cPoint.y), 5, 5);
				}
			}
			
			p.fill(155, 155, 155);
			p.text("["+drawWindow.pMin.x.toFixed(2)+".."+drawWindow.pMax.x.toFixed(2)+", "+drawWindow.pMin.y.toFixed(2)+".."+drawWindow.pMax.y.toFixed(2)+"] / " + slopeFieldSize.toFixed(2), 5, 15);
		}
		
		function inBounds(point)
		{
			return point.x >= drawWindow.pMin.x && point.x <= drawWindow.pMax.x && point.y >= drawWindow.pMin.y && point.y <= drawWindow.pMax.y;
		}

		function calcPoint(point, step, direction, s, a, b, c)
		{
			var k = new Array(s);
			k[0] = slopeAtPoint(point.x, point.y);
			for (var i = 1; i < s; i++) {
				var tempK = 0;
				for (var j = 0; j < i; j++) {
					tempK += a[i][j] * k[j];
				}
				
				var tempAng = Math.atan(tempK) + direction;
				var tempStep = step * c[i];
				var tempX = point.x + tempStep * Math.cos(tempAng);
				var tempY = point.y + tempStep * Math.sin(tempAng);
				k[i] = slopeAtPoint(tempX, tempY);
			}
			
			var tempK = 0;
			for (var i = 0; i < s; i++) {
				tempK += b[i] * k[i];
			}
			var ang = Math.atan(tempK) + direction;
			
			return new Point(point.x + step * Math.cos(ang), point.y + step * Math.sin(ang));
		}
				
		// Only supports explicit Runge-Kutta
		function drawRungeKutta(tableau, startPoint, step, direction)
		{
			var cPoint = startPoint.clone();
			while (inBounds(cPoint)) {
				var nPoint = calcPoint(cPoint, step, direction, tableau.s, tableau.a, tableau.b, tableau.c);
				
				p.line(xCoordinate(cPoint.x), yCoordinate(cPoint.y), xCoordinate(nPoint.x), yCoordinate(nPoint.y));
				cPoint = nPoint;
			}
		}

		function drawTick(point, size)
		{
			p.quad(
				xCoordinate(point.x)-size, yCoordinate(point.y)-size,
				xCoordinate(point.x)+size, yCoordinate(point.y)-size,
				xCoordinate(point.x)+size, yCoordinate(point.y)+size,
				xCoordinate(point.x)-size, yCoordinate(point.y)+size
			);
		}
		
		function drawLine(p1, p2)
		{
			p.line(
				xCoordinate(p1.x), yCoordinate(p1.y),
				xCoordinate(p2.x), yCoordinate(p2.y)
			);
		}
		
		function drawRKE(tableau, startPoint, stepStart, maxErrorSquared, direction)
		{
			var cPoint = startPoint.clone();
			var cStep = stepStart;
			while (inBounds(cPoint)) {
				while (true) {
					var bPoint = calcPoint(cPoint, cStep, direction, tableau.s, tableau.a, tableau.b, tableau.c);
					var bsPoint = calcPoint(cPoint, cStep, direction, tableau.s, tableau.a, tableau.bs, tableau.c);
					
					var xDelta = bPoint.x - bsPoint.x;
					var yDelta = bPoint.y - bsPoint.y;
					
					var errorSquared = xDelta * xDelta + yDelta * yDelta;
					
					if (errorSquared > maxErrorSquared) {
						drawTick(bPoint, 2);
						drawTick(bsPoint, 3);
						cStep = cStep / 2;
						continue;
					}
					drawLine(bPoint, bsPoint);
					
					if (errorSquared < maxErrorSquared / 3) {
						cStep = cStep * 1.5;
					}
					
					break;
				}
				
				p.line(xCoordinate(cPoint.x), yCoordinate(cPoint.y), xCoordinate(bPoint.x), yCoordinate(bPoint.y));
				cPoint = bPoint;
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
$("#heunStep").slider("option", "values", [heunStep.fine, heunStep.coarse]);

function stepChange(ev, ui)
{
	var vals = ui.values; // both values, min and max (fine and coarse)
	switch(ev.target.id) {
		case "eulerStep":
			eulerStep.fromValues(ui.values);
			break;
		case "heunStep":
			heunStep.fromValues(ui.values);
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
	
	if (quiverDrawEnabled) {
		//eulerEnabled = false;
	} else {
		eulerStep.setCoarse();
		heunStep.setCoarse();
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
	//eulerEnabled = true;
	eulerStep.setFine();
	heunStep.setFine();
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