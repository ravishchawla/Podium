(function() {
	
	/*************************************VARIABLES*************************************/
	
	mar = {};
	var data;
	var columns = [];
	var numericalAttributes = [];
	var changedRows = [];
	
	var tolerance; 
	var tableHeight; 
	var numFocalRows, numNonFocalRows; 
	var focalRowHeight, nonFocalRowHeight;
	
	var keys;
	var htmlTableToCache;
	var table, header, body;
	

	
	
	/**********************************LOAD THE TABLE**********************************/
	
	/*
	 * Load the table for the first time 
	 */
	mar.loadTable = function(fileName) {
		loadData(fileName);
	}
	
	
	/*
	 * Private
	 * Load the data from the given file
	 */
	function loadData(fileName) {
		d3.csv(fileName, function(dataset) {
			data = dataset;
			tolerance = data.length / 10;
			if (data.length > 0) {
				
				// determine which attributes are numerical
				keys = Object.keys(data[0]);
				columns.push({ head: "Rank", cl: "rank index null", html: function(row, i) { return (i + 1); } });
				columns.push({ head: "Original Index", cl: "hidden originalIndex", html: function(row, i) { return (i + 1); } });
				for (var attr = 0; attr < keys.length; attr++) {
					var attrName = keys[attr];
					// populate columns with objects to aid D3 
					var isNumerical = true; 
					for (var i = 0; i < data.length; i++) {
						if (isNaN(data[i][attrName])) {
							isNumerical = false; 
							break;
						}
					}
					
					if (isNumerical) {
						columns.push({ head: attrName, cl: attrName + " numericalAttribute", html: ƒ(attrName)});
						numericalAttributes.push(attrName);
						normalizeAttribute(data, attrName, true);
					} else 
						columns.push({ head: attrName, cl: attrName, html: ƒ(attrName)});
				}
			}
			ial.init(data, 0);
			displayTable(data);
		});
	}
	
	
	/*
	 * Private
	 * Display the table
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
				//.html(ƒ("head"))
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
	
	
	
	
	/***********************************TABLE EFFECTS***********************************/
	
	/*
	 * Private
	 * Add functionality:
	 *     click & drag rows
	 *     add arrows to indicate desired values
	 *     table lens 
	 */ 
	function addFunctionality() {
		clickAndDragRows(); 
		addArrows(); 
		tableLens(); 
	}
	
	
	/*
	 * Private
	 * Make rows click & draggable
	 * Change color of row based on direction and magnitude of change
	 */
	function clickAndDragRows() {
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

				// Persistent Index means that a comparison is made between the previous row position and the current position.
				// Non-persistent Index means that the comparison is made between the original row position and the current position.				
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
	}
	
	
	/*
	 * Private
	 * Add up / down arrows to rows to indicate
	 *     up = high values are good
	 *     down = low values are good
	 */
	function addArrows() {
		$("th").each(function(i) {
			if (i > 0) { // don't add to Rank col
				var html_text = $(this).html();
				html_text = html_text + '<input type="image" src="img/arrow-up.png" width=15px class="directionUp"/>';
				$(this).html(html_text);
				$(this).click(function() {
					
					var clickedObjClasses = $(this).attr('class').split(' ');
					// assumes the first class is the name of the attribute - make sure we don't change this convention
					var clickedObjAttribute = clickedObjClasses[0];
					
					var clickedObj = $(this).find("input");
					clickedObj.toggleClass('directionUp', 'directionDown');
					if (clickedObj.hasClass('directionUp')) {
						clickedObj.attr('src', 'img/arrow-up.png');
						// re-normalize the attribute
						normalizeAttribute(data, clickedObjAttribute, true);
					} else {
						clickedObj.attr('src', 'img/arrow-down.png');
						// re-normalize the attribute
						normalizeAttribute(data, clickedObjAttribute, false);
					}
	
				});
			}
		});
	}
	
	
	/*
	 * Private
	 * Add the table lens effect
	 */
	function tableLens() {

		$("tr").hover(function() {

			var difference = focalRowHeight - nonFocalRowHeight;
			var clickedRow = $(this).index();
			var surroundingRows = getSurroundingRowRange(clickedRow, numFocalRows - 1); 
			var size = surroundingRows.length;
			var removePer = difference / size;

			if (clickedRow >= 0 ) {
				var a = focalRowHeight / 16;
				var b = focalRowHeight / 4;
				var c = focalRowHeight;                  // clickedRow
				var d = focalRowHeight / 4;
				var e = focalRowHeight / 16;
				var trA = $("tr").get(clickedRow - 2);
				var trB = $("tr").get(clickedRow - 1);
				var trC = $("tr").get(clickedRow);
				var trD = $("tr").get(clickedRow + 1);
				var trE = $("tr").get(clickedRow + 2);

				$(trA).css("height", a);
				//$(trA).stop(false, false).animate({ height : a});
				//$(trA).css("background","yellow");
				$(trA).css("font-size", "0.4em");
				//$(trA).css("font-size", "xx-small");

				$(trB).css("height", b);
				//$(trB).stop(false, false).animate({ height : b});
				$(trB).css("font-size", "0.8em");
				//$(trB).css("background","yellow");

				$(trC).css("height", c);
				//$(trC).stop(false, false).animate({ height : c});
				//$(trC).css("background","cyan");
				$(trC).css("color", "red");
				$(trC).stop(false, true).animate({ background: "cyan" });
				$(trC).css("font-size", "2em");

				$(trD).css("height", d);
				$(trD).css("font-size", "0.8em");
				//$(trD).stop(false, false).animate({ height : d});
				//$(trD).css("background","yellow");

				$(trE).css("height", e);
				$(trE).css("font-size", "0.4em");
				//$(trE).stop(false, false).animate({ height : e});
				//$(trE).css("background","yellow");
			}
		}, function () {
			$("tr").css("background", "");
			$("tr").css("height", nonFocalRowHeight);
			$("tr").css("font-size", "initial");
			$("tr").css("color", "black");
		});
	}
	
	
	
	
	/*********************************UTILITY FUNCTIONS*********************************/
	
	/*
	 * Private
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
	 * Private
	 * Normalize the data according to the given attribute
	 */
	function normalizeAttribute(dataset, attr, isHighValGood) {
		if (numericalAttributes.indexOf(attr) > -1) {
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
			
			var temp = [];
			if (isHighValGood) {
				for (var i = 0; i < len; i++)
					dataset[i][attr + "Norm"] = (dataset[i][attr] - min) / (max - min);
			} else {
				for (var i = 0; i < len; i++)
					dataset[i][attr + "Norm"] = 1.0 - (dataset[i][attr] - min) / (max - min);
			}
		} else {
			// TODO categorical
		}
	}
	
	
	/*
	 * Private
	 * Get the list of changed rows
	 */
	function getChangedRows() {
		return changedRows;
	}
	
	
	
	
	/**************************************BUTTONS**************************************/
	
	/*
	 * Return the table to its state before changes were made
	 */
	mar.discardButtonClicked = function() {
		console.log("table.js: Discarding Changes"); 
		$("#tablePanel tbody").html(htmlTableToCache);
	}
	
	
	/*
	 * Rank!
	 */
	mar.rankButtonClicked = function() {
		console.log("table.js: Ranking");
		console.log("-- test: Changed rows: " + getChangedRows());
		/*console.log("-- test: svd");
		var mtx = [[.9336, .2273, .2428, -8], 
		           [0, 0, .9420, -20], 
		           [.0094, .0027, 1, -25], 
		           [.8245, .1136, .3696, -62], 
		           [1, .4318, .1268, -75], 
		           [.0894, .0227, .9674, -82], 
		           [.9364, .3636, .1522, -95], 
		           [.8274, 1, 0, -99]];
		var res = numeric.svd(mtx);
		console.log("-- u: " + res.U);
		console.log("-- s: " + res.S);
		console.log("-- v: " + res.V);*/
	}
})();
