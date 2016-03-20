(function() {
	main = {}; 
	
	
	
	/*
	 * initialize the web page
	 */
	main.init = function() {
		$(document).ready(function() {
	        mar.loadTable("data/offenseDataV2.csv");
	    });
	}
})();