(function() {
	mar = {};
	var data; 
	var keys;
	
	/*
	 * load the table for the first time 
	 */
	mar.loadTable = function(fileName) {
		loadData(fileName);
	}
	
	/*
	 * load the data from the given file
	 */
	function loadData(fileName) {
		d3.csv(fileName, function(dataset) {
			data = dataset;
			displayTable(data);
		});
	}
	
	// display the table
	function displayTable(displayData) {
		if (displayData != undefined && displayData.length != 0) {
			keys = Object.keys(displayData[0]);
			var htmlTable = "<table id='tableId'>\n";
			
			// append the header
			htmlTable += "  <thead>\n";
			htmlTable += "    <tr>\n";
			htmlTable += "      <th data-header='rank'  class='dragtable-drag-boundary'><div class='dragtable-drag-handle'></div>Rank</th>\n";
			for (var i = 0; i < keys.length; i++)
				htmlTable += "      <th data-header='" + (i+1) + "'><div class='dragtable-drag-handle'></div>" + keys[i] + "</th>\n";
			htmlTable += "    </tr>\n";
			htmlTable += "  </thead>\n";
			
			// append the data
			htmlTable += "  <tbody>\n";
			for (var i = 0; i < displayData.length; i++) {
				htmlTable += "  <tr>\n";
				htmlTable += "    <td class='index'>" + (i+1) + "</td>\n";
				for (var j = 0; j < keys.length; j++) {
					htmlTable += "    <td>" + displayData[i][keys[j]] + "</td>\n";
				}
				htmlTable += "  </tr>\n";
			}
			htmlTable += "  </tbody>\n";
			htmlTable += "</table>\n";
			$("#tablePanel").append(htmlTable);
			
			addFunctionality(); 
			
			console.log("table.js: table appended");
		}
	}

	// add functionality to click & drag rows & toggle lock cells
	function addFunctionality() {
		// make table columns click & draggable
		$('#tablePanel').dragtable();
		
		// make table rows click & draggable
		var fixHelperModified = function(e, tr) {
			var $originals = tr.children();
			var $helper = tr.clone();
			$helper.children().each(function(index) {
				$(this).width($originals.eq(index).width())
			});
			return $helper;
		};
		var updateIndex = function(e, ui) {
			$('td.index', ui.item.parent()).each(function (i) {
				$(this).html(i + 1);
			});
		};

		$("#tablePanel tbody").sortable({
		    helper: fixHelperModified,
		    stop: updateIndex
		}).disableSelection();
	}
})();