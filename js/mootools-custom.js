/*
---
description: Additional methods for the Array class

license: MIT-style

authors:
- Alexander Herrmann

requires:
  core/1.4.3: [Array]

provides:
- Array.intersect
- Array.differentiate
- Array.getRange
- Array.reverse()
...
*/
Array.implement({
	
	/**
	 * Creates an intersection of the current array and the given one.
	 * Returns as new array.
	 * @param Array other	the array to use
	 * @return Array
	 */
	intersect: function(other) {
		var cpy = this.slice();
		this.each(function(el) {
			if (other.indexOf(el) < 0) {			
				cpy.splice(cpy.indexOf(el), 1);
			}
		}, this);
		return cpy;
	},
	
	/**
	 * Returns the symmetric difference between this array and the given one.
	 * Means the items both arrays include are removed from both and then both are combined.
	 * @param Array other	the array to use
	 * @return Array
	 */
	differentiate: function(other) {
		var src = this.slice();
		var cmp = other.slice();
		other.each(function(elem) {
			if (src.indexOf(elem) > -1) {
				// remove from both
				src.splice(src.indexOf(elem), 1);
				cmp.splice(cmp.indexOf(elem), 1);
			}
		}, this);
		// combine remaining items
		return src.combine(cmp);
	},
	
	/**
	 * Returns the given number of elements from the array starting 
	 * at the given index.
	 * @param int start index
	 * @param int number of elements to return - if not given all elements from start index will be returned
	 * @return Array
	 */
	getRange: function(start, elements) {
		var res = [];
		var j = 0;
		// check if no element count is given
		var upper = this.length;
		if (undefined != elements) {
			var upper = start + elements > this.length ? this.length : start + elements;
		}
		if (start >= 0) {
			for (var i = start; i < upper; i++) {
				res[j++] = this[i];
			}
		}
		return res;
	},
	
	/**
	 * Returns the array as array in reverse order.
	 * @return Array
	 */
	reverse: function() {
		var reversed = [];
		for (var i = this.length - 1; i >= 0; i--) {
			reversed.push(this[i]);
		}
		return reversed;
	}
});
