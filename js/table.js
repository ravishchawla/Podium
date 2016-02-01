(function() {
	
	/*************************************VARIABLES*************************************/
	
	mar = {};
	var data;
	var columns = [];
	var numericalAttributes = [];
	var categoricalAttributeMap = {};
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
				
				keys = Object.keys(data[0]);
				
				// give each data item a unique id
				var counter = 0; 
				for (var i = 0; i < data.length; i++) {
					data[i]["uniqueId"] = counter; 
					counter++;
				}
				
				columns.push({ head: "Rank", cl: "rank index null", html: function(row, i) { return (i + 1); } });
				columns.push({ head: "Original Index", cl: "hidden originalIndex", html: function(row, i) { return (i + 1); } });
				columns.push({ head: "Unique ID", cl: "hidden uniqueId", html: function(row, i) { return data[i]["uniqueId"]; } });
				
				// find numerical and categorical attributes
				for (var attr = 0; attr < keys.length; attr++) {
					var attrName = keys[attr];
					
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
					} else {
						var attrMap = {}; 
						var counter = 0;
						for (var i = 0; i < data.length; i++) {
							var currentVal = data[i][attrName]; 
							if (!attrMap.hasOwnProperty(currentVal)) {
								attrMap[currentVal] = counter;
								counter++; 
							}
						}
						columns.push({ head: attrName, cl: attrName, html: ƒ(attrName)});
						categoricalAttributeMap[attrName] = attrMap; 
					}
					normalizeAttribute(data, attrName, true);
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
				.attr("id", "tableId")
				.attr("width", "100%")
				.attr("border", "0")
				.attr("cellspacing", "0")
				.attr("cellpadding", "0")
				.attr("height", "100%");
			
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
							if (c[k] == "originalIndex" || c[k] == "uniqueId") {
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
			nonFocalRowHeight = $("tr", "#tableId").height();
			focalRowHeight = Number(75);
			
			$("#auxPanel").html("<table id=\"auxTable\">" + table.html() + "</table>");


			
			var fontSize = parseInt($("tr", "#tableId").css("font-size"), 10);	
			var tableObj = document.getElementById("tableId");

			while(tableObj.scrollHeight > tableObj.clientHeight && fontSize >= 1) {
				fontSize--;
				$("tr", "#tableId").css("font-size", fontSize);
				tableRowHeight = $("tr", "#tableId").height();
			}

			addFunctionality(); 
			
			console.log("table.js: table appended");
		}
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
			
			if (isHighValGood) {
				for (var i = 0; i < len; i++)
					dataset[i][attr + "Norm"] = (dataset[i][attr] - min) / (max - min);
			} else {
				for (var i = 0; i < len; i++)
					dataset[i][attr + "Norm"] = 1.0 - (dataset[i][attr] - min) / (max - min);
			}
		} else {
			var min = 0; 
			var max = Number.MIN_VALUE; 
			var len = dataset.length;
			for (var key in categoricalAttributeMap[attr]) {
				var currentVal = Number(categoricalAttributeMap[attr][key]);
				
				if (currentVal > max)
					max = currentVal;
			}
			
			// TODO: Remove isHighValGood from categorical attributes
			if (isHighValGood) {
				for (var i = 0; i < len; i++)
					dataset[i][attr + "Norm"] = (categoricalAttributeMap[attr][dataset[i][attr]] - min) / (max - min);
			} else {
				for (var i = 0; i < len; i++)
					dataset[i][attr + "Norm"] = 1.0 - (categoricalAttributeMap[attr][dataset[i][attr]] - min) / (max - min);
			}
		}
	}
	
	
	/*
	 * Private
	 * Get the list of changed rows
	 */
	function getChangedRows() {
		return changedRows;
	}
	
	
	/*
	 * Get the data item using its unique id
	 */
	function getDataByUniqueId(id) {
		for (var i = 0; i < data.length; i++) {
			if (data[i]["uniqueId"] == id)
				return data[i];
		}
	}
	
	
	/*
	 * Private 
	 * Get the matrix for the rows that changed
	 * Assumes attribute names don't have special characters or spaces
	 */
	function getMatrix(rowNums) {
		var matrix = []; 
		var uniqueIds = []; 
		for (var i = 0; i < rowNums.length; i++) {
			var row = []; 
			var rowData = $('tr', '#tablePanel').eq(rowNums[i]);
			var id = rowData.find("td.uniqueId").html();
			var currentData = getDataByUniqueId(id); 
			for (var j = 0; j < keys.length; j++)
				row.push(currentData[keys[j] + "Norm"]);
			uniqueIds.push(id);
			matrix.push(row); 
		}
		
		return [matrix, uniqueIds];
	}
	
	
	/*
	 * Private
	 * Get the augmented matrix for the rows that changed
	 * Assumes attribute names don't have special characters or spaces
	 */
	function getAugmentedMatrix(rowNums) {
		var matrix = []; 
		var uniqueIds = []; 
		for (var i = 0; i < rowNums.length; i++) {
			var row = []; 
			var rowData = $('tr', '#tablePanel').eq(rowNums[i]);
			var id = rowData.find("td.uniqueId").html();
			var currentData = getDataByUniqueId(id); 
			for (var j = 0; j < keys.length; j++)
				row.push(currentData[keys[j] + "Norm"]);
			row.push(rowNums[i]);
			uniqueIds.push(id); 
			matrix.push(row); 
		}
		
		return [matrix, uniqueIds];
	}
	
	
	/*
	 * Get the ranking of items given the input weight vector
	 */
	function computeRanking(weights) {
		var allRows = []; 
		for (var i = 1; i <= data.length; i++)
			allRows.push(i);
		var matrixResult = getMatrix(allRows);
		
		var matrix = matrixResult[0]; 
		var uniqueIds = matrixResult[1]; 
		var ranked = []; 
		
		for (var i = 0; i < matrix.length; i++) {
			var id = uniqueIds[i];
			var attrVals = matrix[i];
			var dotProd = numeric.dot(attrVals, weights);
			ranked.push({ id: id, val: dotProd });
		}
		
		ranked.sort(function(a, b) {
			return parseFloat(b.val) - parseFloat(a.val);
		})
		
		return ranked;
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
		
		// use SVD to compute w = V * D_0^−1 * U^T * b
		var b = getChangedRows(); 
		if (b.length <= keys.length) {
			console.log("table.js: ERROR - number of rows moved (" + b.length + ") must be greater than number of attributes (" + keys.length + ") to compute rank using SVD");
			return;
		}
		var A = getAugmentedMatrix(b)[0]; 
		
		var SVD = numeric.svd(A); 
		var U = SVD.U; 
		var S = SVD.S; 
		var V = SVD.V; 
		
		var D0 = numeric.inv(numeric.diag(S)[0]); 
		var UT = numeric.transpose(U); 
		var weights = numeric.dot(numeric.dot(numeric.dot(V, D0), numeric.transpose(U)), b);
		var ranking = computeRanking(weights);
		
		//console.log("A (" + A.length + " x " + A[0].length + "): " + JSON.stringify(A));
		//console.log("b (" + b.length + "): " + b);
		//console.log("Weight: " + weights);
		console.log("Ranking: " + JSON.stringify(ranking)); 
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

			console.log(ui.item.html());

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
		}).disableSelection();


		$("#auxPanel tbody").sortable({
		    helper: fixHelperModified,
		    stop: updateIndex,
		    connectWith: "#tablePanel tbody"
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

		var fontSize = parseInt($("tr", "#tableId").css("font-size"), 10);		
		$("tr", "#tablePanel").hover(function() {
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
				$(trC).css("font-size", "1em");

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
			$("tr").css("font-size", fontSize);
			$("tr").css("color", "black");
		});
	}
})();
