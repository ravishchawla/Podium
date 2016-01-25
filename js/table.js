(function() {
	mar = {};
	var data;
	var tableHeight; 
	var numFocalRows, numNonFocalRows; 
	var focalRowHeight, nonFocalRowHeight;
	var keys;
	var numericalAttributes = [];
	var htmlTableToCache;

	

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
			if (data.length > 0) {
				
				// determine which attributes are numerical
				keys = Object.keys(data[0]);
				for (var attr = 0; attr < keys.length; attr++) {
					var isNumerical = true; 
					for (var i = 0; i < data.length; i++) {
						if (isNaN(data[i][keys[attr]])) {
							isNumerical = false; 
							break;
						}
					}
					if (isNumerical) {
						numericalAttributes.push(keys[attr]);
						normalizeAttribute(data, keys[attr], true);
					}
				}
			}
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
			console.log("Keys:  " + keys);
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
				htmlTable += "    <td style='display:none' class='originalIndex'>" + (i+1) + "</td>\n";
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
			$('tr', ui.item.parent()).each(function (i) {
				
				var usePersistentIndex = false;

				var rowObj = $(this).find("td.index");
				
				if(usePersistentIndex == false)
					var oldIndex = $(this).find("td.originalIndex").html();
				else
					var oldIndex = rowObj.html();

				var newIndex = i + 1;

				if(newIndex > oldIndex) {
					$(this).removeClass('lowRowChange');
					$(this).addClass('highRowChange');
				} else if (newIndex < oldIndex) {
					$(this).removeClass('highRowChange');
					$(this).addClass('lowRowChange');
				}

				if(usePersistentIndex == false && newIndex == oldIndex) {
					$(this).removeClass('highRowChange');
					$(this).removeClass('lowRowChange');
				}

				rowObj.html(i+1);

			});

		};


		$("#tablePanel tbody").sortable({
		    helper: fixHelperModified,
		    stop: updateIndex
		}).disableSelection();

		htmlTableToCache = $("#tablePanel tbody").html();

		// add table lens effect
		$(".tableRow").click(function(i) {
			/*console.log("numFocalRows: " + numFocalRows);
			console.log("numNonFocalRows: " + numNonFocalRows); 
			console.log("tableHeight: " + tableHeight);
			console.log("focalRowHeight: " + focalRowHeight);
			console.log("nonFocalRowHeight: " + nonFocalRowHeight);*/

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
	
	
	
	/*
	 * Normalize the data according to the given attribute
	 */
	function normalizeAttribute(dataset, attr, isHighValGood) {
		var min = Number.MAX_VALUE; 
		var max = Number.MIN_VALUE; 
		var len = dataset.length;
		for (var i = 0; i < len; i++) {
			var currentVal = Number(dataset[i][attr]);
			
			if (currentVal < min)
				min = currentVal; 
			if (currentVal > max)
				max = currentVal;
		}
		
		for (var i = 0; i < len; i++)
			dataset[i][attr + "Norm"] = (dataset[i][attr] - min) / (max - min); 
	}
	
	

	/*
	 * Return the table to its state before changes were made
	 */
	mar.discardButtonClicked = function() {
		$("#tablePanel tbody").html(htmlTableToCache);
	}
	
	/*
	 * Rank!
	 */
	mar.rankButtonClicked = function() {
		// TODO: Fill this in
	}

})();