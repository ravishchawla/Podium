(function() {
	mar = {};
	var data;
	var columns = [];
	var numericalAttributes = []
	var tableHeight; 
	var numFocalRows, numNonFocalRows; 
	var focalRowHeight, nonFocalRowHeight;
	var keys;
	var htmlTableToCache;
	var table, header, body;

	var changedRows = [];
	

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
				columns.push({ head: "Rank", cl: "rank index null", html: function(row, i) { return (i + 1); } });
				columns.push({ head: "Original Index", cl: "hidden originalIndex", html: function(row, i) { return (i + 1); } });
				for (var attr = 0; attr < keys.length; attr++) {
					var attrName = keys[attr];
					// populate columns with objects to aid D3 
					columns.push({ head: attrName, cl: attrName, html: ƒ(attrName)});
					var isNumerical = true; 
					for (var i = 0; i < data.length; i++) {
						if (isNaN(data[i][attrName])) {
							isNumerical = false; 
							break;
						}
					}
					if (isNumerical) {
						numericalAttributes.push(attrName);
						normalizeAttribute(data, attrName, true);
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
			
			// append the table
			table = d3.select("#tablePanel")
				.append("table")
				.attr("id", "tableId");
			
			// append the table header
			header = table.append("thead")
				.append("tr")
				.selectAll("th")
				.data(columns)
				.enter()
				.append("th")
				.attr("class", ƒ("cl"))
				.style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; })
				.text(ƒ("head"));
				
			body = table.append("tbody")
				.selectAll("tr")
				.data(data)
				.enter()
				.append("tr")
				.selectAll("td")
				.data(function(row, i) {
					return columns.map(function(c) {
						var cell = {}; 
						d3.keys(c).forEach(function(k) {
							cell[k] = (typeof c[k] == 'function') ? c[k](row, i) : c[k];
							if (c[k] == "rank index")
								c[k] = i;
							if (c[k] == "originalIndex") {
								c[k] = null;
							}
						});
						return cell; 
					});
				}).enter()
				.append("td")
				.style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; })
				.html(ƒ("html"))
				.attr("class", ƒ("cl"));
			
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
			changedRows = [];

			$('tr', ui.item.parent()).each(function (i) {

				//Persistent Index means that a comparison is made between the previous row position and the current position.
				//Non-persistent Index means that the comparison is made between the original row position and the current position.				
				var usePersistentIndex = false;

				var indexObj = $(this).find("td.rank.index");
				
				if(usePersistentIndex == false)
					var oldIndex = $(this).find("td.originalIndex").html();
				else
					var oldIndex = indexObj.html();

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

				if (indexObj.html() != (i+1)) {
					changedRows.push(i+1);
				}

				indexObj.html(i+1);

			});
		};


		$("#tablePanel tbody").sortable({
		    helper: fixHelperModified,
		    stop: updateIndex
		}).disableSelection();

		htmlTableToCache = $("#tablePanel tbody").html();

		// add table lens effect
		$("tr").click(function(i) {
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
		console.log("table.js: RANKING");
		/*console.log("svd test");
		var mtx = [[.9336, .2273, .2428, -8], 
		           [0, 0, .9420, -20], 
		           [.0094, .0027, 1, -25], 
		           [.8245, .1136, .3696, -62], 
		           [1, .4318, .1268, -75], 
		           [.0894, .0227, .9674, -82], 
		           [.9364, .3636, .1522, -95], 
		           [.8274, 1, 0, -99]];
		var res = numeric.svd(mtx);
		console.log("u: " + res.U);
		console.log("s: " + res.S);
		console.log("v: " + res.V);*/
	}

	mar.getChangedRows = function() {
		return changedRows;
	}

})();