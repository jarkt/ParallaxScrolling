window.addEvent('domready', function() {
	$$('ul.stages').each(function(ulStage) {
		new ParallaxScrolling({}, ulStage);
	});
});


var ParallaxScrolling = new Class({

	Implements: [Options],

	options: {
		
	},
	stages: [],
	windowSize: window.getSize(),
	scrollSize: window.getScrollSize(),
	scrollPosition: window.getScroll(),

	initialize: function(options, container) {
		this.setOptions(options);
		this._updateEnvironment();

		// Arrange stages:
		container.getChildren().each(function(element) {
			var stage = {
				'element': element,
				'coordinates': element.getCoordinates(),
				'children': element.getElements('*[data-start][data-target]')
			};
			stage.children.each(function(child) {
				child.setStyle('position', 'relative');
			});
			this.stages.push(stage);
		}.bind(this));

		this._update();
		window.addEvent('scroll', this._update.bind(this));
	},

	_updateEnvironment: function() {
		this.windowSize = window.getSize();
		this.scrollSize = window.getScrollSize();
		this.scrollPosition = window.getScroll();
	},

	_update: function() {
		this._updateEnvironment();
		var stages = this._getStagesByScrollPosition();
		stages.each(this._updateStage.bind(this));
	},

	_updateStage: function(stage) {
		var progress = this._getStageProgress(stage);
		stage.children.each(function(child) {
			this._updateChild(child, progress);
		}.bind(this));
	},

	_updateChild: function(child, progress) {
		var start = child.get('data-start').parseQueryString();
		var target = child.get('data-target').parseQueryString();
		var properties = Object.keys(start).intersect(Object.keys(target));

		var setStyles = function(properties, from, to, percent) {
			properties.each(function(property) {
				var fx = new Fx.CSS({"transition": child.get('data-transition')});
				var fromValue = fx.parse(from[property]);
				var toValue = fx.parse(to[property]);
				var transition = fx.getTransition();
				var delta = transition(percent);
				var value = fx.compute(fromValue, toValue, delta);
//if(property === 'color') console.log(value);
				child.setStyle(property, fx.serve(value));
			});
		};

		if(child.get('data-normal')) {
			var normal = child.get('data-normal').parseQueryString();
			properties = properties.intersect(Object.keys(normal));

			if('flyin' in progress) {
				setStyles(properties, start, normal, progress.flyin);
			} else
			if('flyout' in progress) {
				setStyles(properties, normal, target, progress.flyout);
			} else {
				setStyles(properties, normal, normal, progress.visible);
			}
		} else {
			setStyles(properties, start, target, progress.visible);
		}
	},

	_getStageProgress: function(stage) {
		var scrollBorders = this._getScrollBorders(stage);

		var progress = {
			"visible": (this.scrollPosition.y - scrollBorders.visible.from) / (scrollBorders.visible.to - scrollBorders.visible.from)
		};
		if(this.scrollPosition.y >= scrollBorders.flyin.from && this.scrollPosition.y < scrollBorders.flyin.to) {
			progress.flyin = (this.scrollPosition.y - scrollBorders.flyin.from) / (scrollBorders.flyin.to - scrollBorders.flyin.from);
		}
		if(this.scrollPosition.y > scrollBorders.flyout.from && this.scrollPosition.y <= scrollBorders.flyout.to) {	
			progress.flyout = (this.scrollPosition.y - scrollBorders.flyout.from) / (scrollBorders.flyout.to - scrollBorders.flyout.from);
		}
/*if(stage.element.get('class') == 'stage-1 right') {
	console.log(stage.element.get('class'));
	console.log('visible', scrollBorders.visible);
	console.log('flyin', scrollBorders.flyin);
	console.log('flyout', scrollBorders.flyout);
}
if(stage.element.get('class') == 'stage-2 right') {
	console.log(stage.element.get('class'));
	console.log('visible', scrollBorders.visible);
	console.log('flyin', scrollBorders.flyin);
	console.log('flyout', scrollBorders.flyout);
}
if(stage.element.get('class') == 'stage-3 right') {
	console.log(stage.element.get('class'));
	console.log('visible', scrollBorders.visible);
	console.log('flyin', scrollBorders.flyin);
	console.log('flyout', scrollBorders.flyout);
}
if(stage.element.get('class') == 'stage-4 right') {
	console.log(stage.element.get('class'));
	console.log('visible', scrollBorders.visible);
	console.log('flyin', scrollBorders.flyin);
	console.log('flyout', scrollBorders.flyout);
}*/
		return progress;
	},

	_getScrollBorders: function(stage) {
		var scrollBorders = {
			"visible": {},
			"flyin": {},
			"flyout": {}
		};

		var windowHeight = this.windowSize.y;
		var scrollHeight = this.scrollSize.y;

		// visible from:
		scrollBorders.visible.from = stage.coordinates.top - windowHeight;
		if(scrollBorders.visible.from < 0) { // visible.from initial visible
			scrollBorders.visible.from = 0;
		}
		// visible to:
		scrollBorders.visible.to = stage.coordinates.bottom;
		var maxBottom = scrollHeight - windowHeight;
		if(stage.coordinates.bottom > maxBottom) {
			scrollBorders.visible.to = maxBottom;
		}

		/*
			from: Wo der obere Rand der Bühne in den Sichtbereich gelangt
			to: Wo der untere Rand der Bühne in den Sichtbereich gelangt (1)
			    oder, wenn er initial schon da ist, bzw. die Bühne nicht vollständig
				dargestellt werden kann, wo der obere Rand den Sichtbereich verlässt (2).
				Wenn er ihn nicht verlassen kann entfällt die flyin Animation (3).
		*/
		// flyin from:
		scrollBorders.flyin.from = scrollBorders.visible.from;
		// flyin to:
		var bottomBecomesVisible = stage.coordinates.bottom - windowHeight;
		scrollBorders.flyin.to = bottomBecomesVisible; // (1)
		if(scrollBorders.flyin.to < 0 || stage.coordinates.height > windowHeight) { // bottom initial visible
			scrollBorders.flyin.to = stage.coordinates.top; // (2)
		}
		if(scrollBorders.flyin.to > maxBottom) { // flyin.to is unreachable
			scrollBorders.flyin.to = 0; // flyin.from is also 0, want to bet? No animation! (3)
		}



		// flyout from:
		scrollBorders.flyout.from = stage.coordinates.top;
		if(scrollBorders.flyin.to === bottomBecomesVisible) {
			scrollBorders.flyout.from = bottomBecomesVisible;
		}
		// flyout to:
		scrollBorders.flyout.to = scrollBorders.visible.to;

		return scrollBorders;
	},

	_getStagesByScrollPosition: function() {
		var from = this.scrollPosition.y;
		var to = from + this.windowSize.y;

		var stages = [];
		this.stages.each(function(stage) {
			var cFrom = stage.coordinates.top;
			var cTo = stage.coordinates.bottom;
			var visible = (cFrom <= from && cTo >= from) || (cFrom >= from && cFrom <= to);
			if(visible) {
				stages.push(stage);
			}
		}.bind(this));
		return stages;
	}
});