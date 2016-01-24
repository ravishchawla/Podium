(function() {
	mar = {};
	var data;
	var tableHeight; 
	var numFocalRows, numNonFocalRows; 
	var focalRowHeight, nonFocalRowHeight;
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
			ial.init(data, 0);
			displayTable(data);
		});
	}
	
	/*
	 * display the table
	 */
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
				htmlTable += "  <tr class='tableRow'>\n";
				htmlTable += "    <td class='index'>" + (i+1) + "</td>\n";
				for (var j = 0; j < keys.length; j++) {
					htmlTable += "    <td>" + displayData[i][keys[j]] + "</td>\n";
				}
				htmlTable += "  </tr>\n";
			}
			htmlTable += "  </tbody>\n";
			htmlTable += "</table>\n";
			$("#tablePanel").append(htmlTable);
			
			tableHeight = Number(document.getElementById("tableId").offsetHeight); 
			numFocalRows = (data.length > 5) ? Number(5) : Number(0);
			numNonFocalRows = (data.length - 5 > 0) ? Number(data.length - 5): Number(0); 
			focalRowHeight = Number(75);
			nonFocalRowHeight = Number((tableHeight - (focalRowHeight * numFocalRows)) / (numNonFocalRows));
			
			addFunctionality(); 
			
			console.log("table.js: table appended");
		}
	}

	/*
	 * add functionality:
	 *     click & drag rows
	 *     table lens 
	 */ 
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
		
		// add table lens effect
		$(".tableRow").click(function(i) {
			console.log("numFocalRows: " + numFocalRows);
			console.log("numNonFocalRows: " + numNonFocalRows); 
			console.log("tableHeight: " + tableHeight);
			console.log("focalRowHeight: " + focalRowHeight);
			console.log("nonFocalRowHeight: " + nonFocalRowHeight);

			// make all other rows normal height
			$("#tablePanel tbody tr").each(function(i) {
				$(this).css("height", nonFocalRowHeight + "px")
					.removeClass("focalRow");
			}); 

			// increase row height of the given row
			var clickedRow = $(this).index();
			var surroundingRows = getSurroundingRowRange(clickedRow, numFocalRows - 1); 
			for (var i = 0; i < surroundingRows.length; i++) {
				$(".tableRow").eq(surroundingRows[i])
					.css("height", focalRowHeight + "px")
					.addClass("focalRow");
			}
		});
		
	}
	
	/*
	 * For the given row number, determine the range of cells to 
	 * apply the fisheye effect to.
	 */
	function getSurroundingRowRange(clickedRow, numFocalRows) {
		var surroundingRows = []; 
		var halfNumFocalRows = numFocalRows / 2.0; 
		var numTopHalf = Math.floor(halfNumFocalRows); 
		var numBottomHalf = Math.ceil(halfNumFocalRows);
		var numAbove, numBelow; 
		if (clickedRow >= numTopHalf && clickedRow < (data.length - numBottomHalf)) {
			numBelow = numBottomHalf; 
			numAbove = numTopHalf; 
		} else if (clickedRow >= numTopHalf) { 
			numBelow = (data.length - clickedRow - 1 > 0) ? (data.length - clickedRow - 1) : 0; 
			numAbove = numTopHalf + (numBottomHalf - numBelow);
		} else if (clickedRow < (data.length - numBottomHalf)) {
			numAbove = (clickedRow > 0) ? clickedRow : 0; 
			numBelow = numBottomHalf + (numTopHalf - numAbove);
		} else {
			numAbove = (clickedRow > 0) ? clickedRow : 0;
			numBelow = (data.length - clickedRow - 1 > 0) ? (data.length - clickedRow - 1) : 0;
		}
		
		for (var i = numAbove; i >= 1; i--)
			surroundingRows.push(clickedRow - i);
		surroundingRows.push(clickedRow);
		for (var i = 1; i <= numBelow; i++)
			surroundingRows.push(clickedRow + i);
		
		return surroundingRows; 
	}
})();