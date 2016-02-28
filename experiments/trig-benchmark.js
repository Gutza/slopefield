$(function() {

	function iterate(iterations)
	{
		var slopes = [];
		var init_start = new Date().getTime();
		for(var i = 0; i<iterations; i++) {
			slopes.push(Math.random() * Number.MAX_VALUE);
		}
		var init_end = new Date().getTime();
		var init_ms = init_end - init_start;

		var slopeFieldSize = 5;
		var x = 10;
		var y = 10;

		var p = new Processing();

		var arit_start = new Date().getTime();
		for (var i = 0; i<iterations; i++) {
			var slope = slopes[i];
			var endX = x + slopeFieldSize;
			var endY = y + slopeFieldSize * slope;
			var distance = p.dist(x, y, endX, endY);
			var factor = slopeFieldSize/distance/2;
			
			var slope2 = -1 / slope;
			var endX2 = x + slopeFieldSize;
			var endY2 = y + slopeFieldSize * slope2;
			var distance2 = p.dist(x, y, endX2, endY2);
			var factor2 = slopeFieldSize/distance2/8;
			
			var x11 = x - slopeFieldSize * factor2;
			var y11 = y - slopeFieldSize * factor2 * slope;
			var x12 = x - slopeFieldSize * factor;
			var y12 = y - slopeFieldSize * factor * slope2;
			var x13 = x + slopeFieldSize * factor2;
			var y13 = y + slopeFieldSize * factor2 * slope;
			var x14 = x + slopeFieldSize * factor;
			var y14 = y + slopeFieldSize * factor * slope2;

			var x21 = x - slopeFieldSize * factor;
			var y21 = y - slopeFieldSize * factor * slope;
			var x22 = x - slopeFieldSize * factor2;
			var y22 = y - slopeFieldSize * factor2 * slope2;
			var x23 = x + slopeFieldSize * factor;
			var y23 = y + slopeFieldSize * factor * slope;
			var x24 = x + slopeFieldSize * factor2;
			var y24 = y + slopeFieldSize * factor2 * slope2;
		}
		var arit_end = new Date().getTime();
		var arit_ms = arit_end - arit_start;

		/*
		The arithmetic operations above are real, they were actually used to plot slope fields.

		The trigonometric operations below are 100% fiction, I made them up and never used them
		for any practical purpose. But I expect that would be the kind of computational effort
		required to replicate the results above.
		*/

		var trig_start = new Date().getTime();
		for (var i = 0; i<iterations; i++) {
			var slope = slopes[i];
			
			var ang = Math.atan(slope);
			var perpAng = ang + Math.PI;
			
			var smallFieldSize = slopeFieldSize / 8;
			
			var x11 = x - Math.cos(ang) * slopeFieldSize;
			var y11 = y - Math.sin(ang) * slopeFieldSize;
			var x12 = x - Math.sin(ang) * smallFieldSize;
			var y12 = y - Math.cos(ang) * smallFieldSize;
			var x13 = x - Math.sin(ang) * slopeFieldSize;
			var y13 = y - Math.cos(ang) * slopeFieldSize;
			var x14 = x - Math.cos(ang) * smallFieldSize;
			var y14 = y - Math.sin(ang) * smallFieldSize;

			var x11 = x - Math.cos(perpAng) * slopeFieldSize;
			var y11 = y - Math.sin(perpAng) * slopeFieldSize;
			var x12 = x - Math.sin(perpAng) * smallFieldSize;
			var y12 = y - Math.cos(perpAng) * smallFieldSize;
			var x13 = x - Math.sin(perpAng) * slopeFieldSize;
			var y13 = y - Math.cos(perpAng) * slopeFieldSize;
			var x14 = x - Math.cos(perpAng) * smallFieldSize;
			var y14 = y - Math.sin(perpAng) * smallFieldSize;
		}
		var trig_end = new Date().getTime();
		var trig_ms = trig_end - trig_start;

		$("#work-area").append("Finished " + parseInt(iterations).toLocaleString() + " tests: arithmetic = " + arit_ms + " ms; trigonometric = " + trig_ms + " ms.<br />");
		
		var result = {
			init_ms: init_ms,
			arit_ms: arit_ms,
			trig_ms: trig_ms,
		};
		
		return result;
	}

	var iterations = 1000000;

	var results = [];
	for (var j = 0; j < 10; j++) {
		var result = iterate(iterations);
		results.push(result);
	}

	var total = {
		init_ms: 0,
		arit_ms: 0,
		trig_ms: 0,
	};
	
	for (var j = 0; j < results.length; j++) {
		total.init_ms += results[j].init_ms;
		total.arit_ms += results[j].arit_ms;
		total.trig_ms += results[j].trig_ms;
	}
	
	var average = {
		init: total.init_ms / results.length,
		arit: total.arit_ms / results.length,
		trig: total.trig_ms / results.length,
	};
	
	var fps = {
		arit: 1000 / average.arit * iterations * 8,
		trig: 1000 / average.trig * iterations * 8,
	};
	
	$("#stats").text(parseInt(iterations).toLocaleString() + " iterations: init: " + average.init.toFixed(0) + " ms; arithmetic: " + average.arit.toFixed(0) + " ms ("+ parseInt(fps.arit.toFixed(0)).toLocaleString() +" vps); trigonometric: " + average.trig.toFixed(0) + " ms ("+ parseInt(fps.trig.toFixed(0)).toLocaleString() +" vps)");
	$("#browser").text(navigator.userAgent);
});