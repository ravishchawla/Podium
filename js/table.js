(function() {
	
	/*************************************VARIABLES*************************************/
	
	mar = {};
	var data;
	var opacityScale;
	var columns = [];
	var numericalAttributes = [];
	var categoricalAttributeMap = {};
	var attributeWeights = [];

	var lastChangedRow;
	var changedRows = [];
	
	var tolerance; 
	var mapBarHeight;
	var minimap_width = 50;
	var console_width = 150;

	var keys;
	var htmlTableToCache;
	var table, header, rows, cells;

	var useCategorical = false; 
	var interactionIncrement = 1; 
	var maxInteractionWeight = 0.5;
	var maxRankScore = 1; 

	var showAllRows = true;
	var colorOverlay = true;
	var fishEyeOverlay = true;
	
	
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
			opacityScale = d3.scale.quantize()
				.domain([0, data.length])
				.range([0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1]); 
			tolerance = data.length / 10;
			if (data.length > 0) {
				
				keys = Object.keys(data[0]);
				
				// give each data item a unique id
				var counter = 0; 
				for (var i = 0; i < data.length; i++) {
					data[i]["uniqueId"] = counter + 1; 
					data[i]["rank"] = counter + 1;
					data[i]["oldIndex"] = counter + 1; 
					data[i]["rankScore"] = 0;
					counter++;
				}
				
				columns.push({ head: "Rank", cl: "rank index null", html: function(row, i) { return data[i]["rank"]; } });
				columns.push({ head: "Rank Score", cl: "rankScore", html: function(row, i) { return data[i]["rankScore"]; } });
				columns.push({ head: "Old Index", cl: "hidden oldIndex", html: function(row, i) { return data[i]["oldIndex"]; } });
				columns.push({ head: "Unique ID", cl: "hidden uniqueId", html: function(row, i) { return data[i]["uniqueId"]; } });
				columns.push({ head: "Interaction", cl: "interactionWeight", html: function(row, i) { return data[i]["ial"]["weight"]; } });
				
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
				.insert("table", ":first-child")
				.attr("id", "tableId")
				.attr("class", "table");
			
			// append the mini map
			minimap = d3.select("#auxContentDiv")
				.append("table")
				.attr("id", "miniChart")

			consolePanel = d3.select("#auxContentDiv")
				.append("table")
				.attr("id", "consoleChart")
				.attr("hidden", "hidden");

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

			// append the rows
			m = -1;
			rows = table.append("tbody")
				.selectAll("tr")
				.data(data)
				.enter()
				.append("tr")
				.attr("id",function(){
					m += 1;
					return "tr" + m;
				});
			
			// append the rows of the mini map
			minimap_rows = minimap.append("tbody")
				.selectAll("tr")
				.data(data)
				.enter()
				.append("tr");
 
			console_rows = consolePanel.append("tbody")
				.selectAll("tr")
				.data(numericalAttributes)
				.enter()
				.append("tr");

			// append the cells
			cells = rows.selectAll("td")
				.data(function(row, i) {
					return columns.map(function(c) {
						var cell = {}; 
						d3.keys(c).forEach(function(k) {
							cell[k] = (typeof c[k] == 'function') ? c[k](row, i) : c[k];
							if (c[k] == "rank index" || c[k] == "oldIndex")
								c[k] = i;
							if (c[k] == "uniqueId") {
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
			
			var num_rows = cells.length;
			var num_cols = numericalAttributes.length;

			// append mini map cells
			minimap_rows.selectAll("td")
				.data(function(row, i) {
					return [
							{ column: "svg", value: '<svg width="50"><rect width=' + 
								minimap_width * (data.length - row["rank"]) / data.length +
								' height="5" fill="' + "#337ab7" + '"/></svg>' }];

				}).enter()
				.append("td")
				.style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; })
				.html(function(d) { return d.value; })
				.attr("height", "10px");

			console_rows.selectAll("td")
				.data(function(column, i) {
					return [{id: i, name: column, amount: (1/num_cols).toFixed(2)}];
				}).enter()
				.append("td")
				.html(function(d) {
					attributeWeights[d.id] = d.amount;
					return "<p class=columnChartName id=col" + d.id + " name=" + d.name + ">" + d.name + "</p><p class=columnChartVal id=colVal" + d.id + ">" + (d.amount * 100) + "%</p>"})
				.append("svg")
				.append("rect")
				.attr("fill", "#337ab7")
				.attr("id", function(d) { return "rect" + d.id;})
				.attr("width", function(d) {
					d.width = (console_width * d.amount);
					return d.width + "px";
				})
				.attr("height", "10px")
				.call(d3.behavior.drag().on('drag', function(d) {
					var new_width = d.width + d3.event.dx;

					if(new_width < 0)
						new_width = 0;

					if(new_width > console_width)
						new_width = console_width;

					d.width = new_width;
					d.amount = ((new_width)/console_width).toFixed(2);
					attributeWeights[d.id] = d.amount;
					d3.select(this).attr("width", d.width);
					d3.select("#colVal" + d.id).html(
						"<p class=columnChartVal id=colVal" + d.id + ">" + (d.amount * 100) + "%</p>");
				}));


			$("td", "#miniChart").attr("height", "1");
			$("td", "#consoleChart").attr("height", "1");

			mapBarHeight = $("svg").height();

			var tableObj = document.getElementById("miniChart");
			while(tableObj.scrollHeight > tableObj.clientHeight && mapBarHeight >= 1) {
				mapBarHeight--;
				$("svg", "#miniChart").height(mapBarHeight);
			}

			$("td.interactionWeight").addClass("tableSeperator")			
			addFunctionality(); 
			
			console.log("table.js: table appended");
		}
	}
	
	
	/*
	 * Update the table to display the given data
	 */
	mar.updateTable = function() { 
		// update the rows
		rows = table.select("tbody")
			.selectAll("tr")
			.data(data);
		
		// update the cells
		cells = rows.selectAll("td")
			.data(function(row, i) {
				return columns.map(function(c) {
					var cell = {}; 
					d3.keys(c).forEach(function(k) {
						cell[k] = (typeof c[k] == 'function') ? c[k](row, i) : c[k];
						if (c[k] == "rank index" || c[k] == "oldIndex")
							c[k] = i;
						if (c[k] == "uniqueId")
							c[k] = null;
					});
					return cell; 
				});
			}).style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; })
			.html(ƒ("html"))
			.attr("placeHolder", function(d, i) {
				// update the rank and old index
				var rowData = $('tr', '#tablePanel').eq(i);
				var id = rowData.find("td.uniqueId").html(); 
				if (id != undefined) {
					var dataItem = getDataByUniqueId(id);
					var newIndex = i; 
					var oldIndex = Number(dataItem["oldIndex"]);

					rowData.find("td.oldIndex").html(oldIndex);
					rowData.find("td.rank").html(newIndex);
				}
			}).attr("class", ƒ("cl"))
			.transition()
			.duration(1000);

		$("td.interactionWeight").addClass("tableSeperator")			
	}
	
	/*
	 * Update the mini map 
	 */
	mar.updateMinimap = function() {

		minimap = d3.select("#auxPanel #miniChart");
		minimap_rows = minimap.select("tbody")
			.selectAll("tr")
			.data(data);

		var minimap_width = 50;
		var num_rows = cells.length;

		minimap_rows.selectAll("td")
			.data(function(row, i) {
				var barColor = "#337ab7";
				if (row["rank"] < row["oldIndex"])
					barColor = "#58DA5B";
				else if (row["rank"] > row["oldIndex"])
					barColor = "#DA5B58";
				
				var opacity = opacityScale(Math.abs(Number(row["rank"]) - Number(row["oldIndex"])));
				if (row["rank"] == row["oldIndex"])
					opacity = 1;

				return [
				        { column: "svg", value: '<svg width="50"><rect width=' + minimap_width * row["rankScore"] / maxRankScore
				        	+ ' height="5" fill="' + barColor + '" fill-opacity="' + opacity + '"/></svg>' }];
	
			})
			.style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; })
			.html(function(d) {return d.value; })
			.attr("height",  "10px");

		$("td", "#miniChart").attr("height", "1");
		$("svg").height(mapBarHeight);
	}
	
	
	/************************************RANK UTILITY************************************/
	
	/*
	 * Private 
	 * Update the weights of the attributes based on changes to the bar width
	 */
	function updateColumnWeights(weights = null) {

		totalPercentage = 0;
		if (weights == null) {
			d3.selectAll("#consoleChart td").each(function(d, i) {
				totalPercentage = totalPercentage + Number(d.amount);
			});
		}

		d3.selectAll("#consoleChart td").each(function(d, i) {
			if (weights == null)
				d.amount = ((d.amount/totalPercentage)).toFixed(2);
			else
				d.amount = (weights[i]).toFixed(2);


			attributeWeights[d.id] = d.amount;
			d.width = (console_width * d.amount);
			
			d3.select("#rect" + d.id).attr("width", d.width);
			d3.select("#colVal" + d.id).html(
						"<p class=columnChartVal id=colVal" + d.id + ">" + (d.amount * 100) + "%</p>");
		});
	}
	
	
	/*
	 * Private
	 * Get a list of the rank values for the given list of unique ids
	 */
	function getRankValues(uniqueIds) {
		var rankVals = [];
		for (var i = 0; i < uniqueIds.length; i++) {
			var dataItem = getDataByUniqueId(Number(uniqueIds[i]));
			rankVals.push(Number(dataItem["rank"]));
		}
		
		return rankVals;
	}
	
	
	/*
	 * Private
	 * Get a list of n rows taken from the surrounding area of the clicked rows
	 * Input is an array of unique ids
	 */
	function getRowsForSVD(clickedRows, numRows) {
		
		// use the rank values of the rows with the given unique ids
		clickedRows = getRankValues(clickedRows); 
		
		if (numRows > data.length) {
			console.log("table.js: cannot get more than " + data.length + " rows");
			return [];
		}
			
		var rowsForSVD = clickedRows.slice();
		var numSurrounding = Math.ceil((numRows - clickedRows.length) / clickedRows.length); 
		
		for (var i = 0; i < clickedRows.length; i++) {
			var r = Number(clickedRows[i]);
			var count = 0; 
			var currentDist = 1; 
			
			// crawl out to find numSurrounding new rows
			while (count < numSurrounding) {
				// check r - currentDist
				if (r - currentDist > 0 && rowsForSVD.indexOf(r - currentDist) < 0) {
					rowsForSVD.push(r - currentDist);
					count++;
				}
				
				if (count == numSurrounding)
					break; 
				
				// check r + currentDist
				if (r + currentDist <= data.length && rowsForSVD.indexOf(r + currentDist) < 0) {
					rowsForSVD.push(r + currentDist);
					count++;
				}
				
				currentDist++; 
				if (currentDist > data.length)
					break;
			}
		}
		
		// return the unique ids of the adjacent rows
		return getUniqueIds(rowsForSVD);
	}
	
	
	/*
	 * Private
	 * Get the list of changed rows
	 */
	function getChangedRows() {
		return changedRows;
	}
	
	
	/*
	 * Private
	 * Get the list of all rows
	 */
	function getAllRows() {
		var allRows = [];
		for (var i = 1; i <= data.length; i++)
			allRows.push(i);
		return allRows;
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
			if (useCategorical) {
				for (var j = 0; j < keys.length; j++)
					row.push(currentData[keys[j] + "Norm"]);
			} else {
				for (var j = 0; j < numericalAttributes.length; j++)
					row.push(currentData[numericalAttributes[j] + "Norm"]);
			}
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
			if (useCategorical) {
				for (var j = 0; j < keys.length; j++)
					row.push(currentData[keys[j] + "Norm"]);
			} else {
				for (var j = 0; j < numericalAttributes.length; j++)
					row.push(currentData[numericalAttributes[j] + "Norm"]);
			}
			row.push(data.length + 1 - rowNums[i]); // maps everything [1, n] -> [n, 1]
			uniqueIds.push(id); 
			matrix.push(row); 
		}
		
		return [matrix, uniqueIds];
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
			
			for (var i = 0; i < len; i++) {
				dataset[i][attr + "Norm"] = (categoricalAttributeMap[attr][dataset[i][attr]] - min) / (max - min);
			}
		}
	}
	
	
	/*
	 * Private 
	 * Normalize the interaction value and weight for each data item
	 */
	function normalizeInteractions() {
		var len = data.length;
		var weightSum = 0; 
		var rankSum = 0;
		for (var i = 0; i < len; i++) { 
			var currentWeight = Number(data[i].ial.weight);
			var currentRank = Number(data[i]["rank"]);
			weightSum += currentWeight; 
			rankSum += currentRank; 
		}
		
		for (var i = 0; i < len; i++) {
			data[i].ial.weightNorm = maxInteractionWeight * (data[i].ial.weight / weightSum);
			data[i].rankNorm = 1.0 - (data[i].rank / rankSum);
		}
	}
	
	
	/*
	 * Private
	 * Normalize the given input vector so the sum of the 
	 * components = 1
	 */
	function normalize(input) {
		var result = []; 
		
		// first normalize the result to be in the range 0-1
		var minMax = getMinAndMax(input); 
		var min = minMax[0];
		var max = minMax[1];
		for (var i = 0; i < input.length; i++)
			result.push((input[i] - min) / (max - min));
		
		// now normalize so the components sum to 1
		var sum = getSum(result);
		var len = result.length;
		
		for (var i = 0; i < len; i++)
			result[i] = result[i] / sum; 
		
		return result;
	}
	
	
	/*
	 * Private
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
		
		normalizeInteractions(); // normalize weights and values
		
		for (var i = 0; i < matrix.length; i++) {
			var id = uniqueIds[i];
			var obj = getDataByUniqueId(Number(id)); 
			var attrVals = matrix[i];
			var dotProd = Number(numeric.dot(attrVals, weights));
			var interactionWeight = Number(obj.ial.weightNorm);
			var interactionVal = Number(obj.rankNorm);
			var result = (interactionWeight * interactionVal) + ((1.0 - interactionWeight) * dotProd); 
			obj["rankScore"] = result;
			ranked.push({ id: id, val: result });
		}
		
		ranked.sort(function(a, b) {
			return parseFloat(b.val) - parseFloat(a.val);
		});
		
		maxRankScore = ranked[0]["val"];
		
		return ranked;
	}
	
	
	/*
	 * Private
	 * Runs SVD on the changed rows and returns an array of normalized weights
	 * If no rows have been changed, returns the current array of attribute weights
	 */
	function runSVD() {
		// use SVD to compute w = V * D_0^−1 * U^T * b
		var minRows = useCategorical ? keys.length + 1 : numericalAttributes.length + 1;
		var b = getRowsForSVD(getChangedRows(), keys.length + 1); 

		if (b.length <= keys.length) {
			// make sure the weights are updated
			updateColumnWeights(); 
			return attributeWeights;
		}
		
		// don't recompute SVD unless something has been moved
		if (getChangedRows().length < 1) {
			console.log("table.js: No changes have been made!");
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
		var normalizedWeights = normalize(weights);

		return normalizedWeights;
	}
	
	
	/*********************************UTILITY FUNCTIONS*********************************/
	
	/*
	 * Update the order of the data according to the input array
	 */
	mar.updateData = function(newOrder) {
		// the new data is an array containing {id, val} pairs -- use it to reconstruct data array
		var updatedData = [];
		for (var i = 0; i < newOrder.length; i++)
			updatedData.push(getDataByUniqueId(Number(newOrder[i]["id"])));
		
		data = updatedData;
	}
	
	
	/*
	 * Private
	 * Update the opacity of the given row object based on the change in index
	 */
	function updateColorAndOpacity(rowObj, oldIndex, newIndex) {
		var opacity = opacityScale(Math.abs(Number(newIndex) - Number(oldIndex)));
		if (newIndex == oldIndex)
			opacity = 0;

		if (colorOverlay) {
			if (rowObj.hasClass('greenColorChange')) 
				rowObj.css("background-color", 'rgba(88, 218, 91, ' + opacity + ')');
			else if (rowObj.hasClass('redColorChange'))
				rowObj.css("background-color", 'rgba(218, 91, 88, ' + opacity + ')');
		}
	}
	
	
	/*
	 * Private
	 * Get a list of unique ids for the given list of rank values
	 */
	function getUniqueIds(rankVals) {
		var uniqueIds = [];
		for (var i = 0; i < rankVals.length; i++) {
			// get the row
			var rowObj = $('tr', '#tablePanel').eq(rankVals[i]);
			uniqueIds.push(Number(rowObj.find("td.uniqueId").html()));
		}
		
		return uniqueIds;
	}
	
	
	/*
	 * Private
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
	 * Get the min and max of the given list of numbers
	 */
	function getMinAndMax(input) {
		var min = Number.MAX_VALUE; 
		var max = Number.MIN_VALUE;
		var len = input.length;
		
		for (var i = 0; i < len; i++) { 
			var currentVal = Number(input[i]);
				
			if (currentVal < min)
				min = currentVal; 
			if (currentVal > max)
				max = currentVal;
		}
		
		return [min, max];
	}
	
	/*
	 * Private
	 * Get the sum of the given list of numbers
	 */
	function getSum(input) {
		var sum = 0; 
		for (var i = 0; i < input.length; i++)
			sum += input[i];
		
		return sum;
	}
	

	/*
	 * Private
	 * Toggles the state of the tabs when they are clicked upon.
	 */
	function toggleActiveTab(consoleTab, minimapTab) {
		consoleTab = $("#auxPanel #consoleTab");
		consoleTab.toggleClass("active");

		minimapTab = $("#auxPanel #minimapTab");
		minimapTab.toggleClass("active");	
	}	
	
	
	/**************************************INPUTS**************************************/
	
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
		
		var normalizedWeights = runSVD();
		var ranking = computeRanking(normalizedWeights);

		// update oldIndex to the old rank position and update rank
		for (var i = 0; i < ranking.length; i++) {
			var id = Number(ranking[i]["id"]);
			var obj = getDataByUniqueId(id);
			
			obj["oldIndex"] = obj["rank"]; 
			obj["rank"] = i + 1;
		}
		
		// update the table order and color the rows
		mar.updateData(ranking);
		mar.updateMinimap();
		mar.updateTable(); 
		colorRows();
		
		// update oldIndex to match rank after it has been used to color rows
		for (var i = 0; i < ranking.length; i++) {
			var id = Number(ranking[i]["id"]);
			var obj = getDataByUniqueId(id);
			var rank = obj["rank"];
			obj["oldIndex"] = rank; 
			var rowObj = $('tr', '#tablePanel').eq(i + 1);
			rowObj.find("td.oldIndex").html(rank);
		}
		
		changedRows = []; // reset changed rows

		updateColumnWeights(normalizedWeights);
		

		//console.log("A (" + A.length + " x " + A[0].length + "): " + JSON.stringify(A));
		//console.log("b (" + b.length + "): " + b);
		//console.log("Weight: " + weights);
		//console.log("table.js: Ranking - " + JSON.stringify(ranking)); 
		
		htmlTableToCache = $("#tablePanel tbody").html(); // cache the new table
	}
    

	/*
	 * Toggle the color overlay
	 */
	mar.colorOverlayToggle = function() {
		colorOverlay = !colorOverlay;

		if (!colorOverlay)
			$("tr").css("background","white");
		else
			colorRows();
	}


	/*
	 * Toggle the fisheye effect
	 */
	mar.fisheyeToggle = function() {
		fishEyeOverlay = !fishEyeOverlay;
		//console.log("Fish eye effect : " + fishEyeOverlay);
	}


	/*
	 * Toggle showing all rows
	 */
	mar.allRowsCheckClicked = function() {
		showAllRows = !showAllRows;
		colorRows();
	}

	/*
	 * Toggle to the console tab
	 */
	mar.changeToConsole = function() {
		toggleActiveTab();
		
		$("#miniChart").attr("hidden", "hidden");
		$("#consoleChart").removeAttr("hidden");
		
	}

	/*
	 * Toggle to the mini map tab
	 */
	mar.changeToMinimap = function() {
		toggleActiveTab();
		$("#miniChart").removeAttr('hidden');
		$("#consoleChart").attr("hidden", "hidden");
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
		//if (fishEyeOverlay)
		//	tableLens();
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

			lastChangedRow = tr;
			changedRows.push(tr.find("td.uniqueId").html());
			return $helper;
		};
		
		var updateIndex = function(e, ui) {
			
			var id = Number(ui.item.find("td.uniqueId").html());
			var dataItem = getDataByUniqueId(Number(id));
			var w = interactionIncrement; 
			if (Number(dataItem["oldIndex"]) == Number(ui.item.index())) 
				w = 0;
			ial.incrementItemWeight(dataItem, w);
			
			ui.item.find("td.interactionWeight").html(dataItem.ial.weight);

			$('tr', ui.item.parent()).each(function(i) {
				// update the rank attribute
				id = Number($(this).find("td.uniqueId").html());
				dataItem = getDataByUniqueId(Number(id));
				dataItem["rank"] = i + 1;
				$(this).find("td.rank.index").html(i + 1);
			});	

			colorRows();

		};


		$("#tablePanel tbody").sortable({
		    helper: fixHelperModified,
		    stop: updateIndex
		}).disableSelection();

		htmlTableToCache = $("#tablePanel tbody").html();
	}
	

	/*
	 * Private
	 * Modify the colors of the rows based on where they have been moved
	 */
	function colorRows() {
		var movedRow = $(lastChangedRow);
		$('tr', "#tablePanel tbody").each(function (i) {
		
			var newIndex = Number($(this).find("td.rank.index").html());
			var oldIndex = Number($(this).find("td.oldIndex").html());
			var uniqueId = $(this).find("td.uniqueId").html();

			var movedRowIndex = movedRow.find("td.rank.index").html();

			if ((showAllRows == false && changedRows.indexOf(uniqueId) == -1) ||
					(newIndex == oldIndex)) {
				$(this).removeClass('greenColorChange');
				$(this).removeClass('redColorChange');
				$(this).animate({backgroundColor: "transparent"}, 1000);
				return true;
			} else if (newIndex > oldIndex) {
				$(this).removeClass('greenColorChange');
				$(this).addClass('redColorChange');
			} else if (newIndex < oldIndex) {
				$(this).removeClass('redColorChange');
				$(this).addClass('greenColorChange');
			}
			
			updateColorAndOpacity($(this), oldIndex, newIndex);
		});
	}
	
	/*
	 * Private
	 * Toggle the arrow for the given attribute to be up or down
	 */
	function toggleRowItemClass(clickedObj) {
		if (clickedObj.hasClass("directionUp")) {
			clickedObj.removeClass("directionUp");
			clickedObj.addClass("directionDown");
		} else if (clickedObj.hasClass("directionDown")) {
			clickedObj.removeClass("directionDown");
			clickedObj.addClass("unusedRow");
		} else if (clickedObj.hasClass("unusedRow")) {
			clickedObj.removeClass("unusedRow");
			clickedObj.addClass("directionUp");
		}
	}

	/*
	 * Private
	 * Add up / down arrows to rows to indicate
	 *     up = high values are good
	 *     down = low values are good
	 */
	function addArrows() {
		consoleRows = $("#consoleChart td p");
		$("#tablePanel th").each(function(i) {
			if (i > 0) { // don't add to Rank col
				var html_text = $(this).html();
				if (numericalAttributes.indexOf(html_text) > -1) {
					conrow = $('#consoleChart td p[name="' + html_text + '"]');
					conrow = conrow[0];
					//$(this).html(html_text);
					html_text = '<input type="image" src="img/arrow-up.png" width=15px class="directionUp"/>' + html_text;
					$(conrow).html(html_text);
					$(conrow).click(function() {
						var clickedObj = $(this).find("input")[0];
						var clickedObjClasses = $(clickedObj).attr('class').split(' ');
						// assumes the first class is the name of the attribute - make sure we don't change this convention
						var clickedObjAttribute = clickedObjClasses[0];
						toggleRowItemClass($(clickedObj));
						if ($(clickedObj).hasClass('directionUp')) {
							$(clickedObj).attr('src', 'img/arrow-up.png');
							$((($(this).parent())[0])).removeClass("disabledAttribute")
							// re-normalize the attribute
							normalizeAttribute(data, clickedObjAttribute, true);
						} else if ($(clickedObj).hasClass('directionDown')) {
							$(clickedObj).attr('src', 'img/arrow-down.png');
							// re-normalize the attribute
							normalizeAttribute(data, clickedObjAttribute, false);
						} else if ($(clickedObj).hasClass('unusedRow')) {
							$(clickedObj).attr('src', 'img/remove.png');
							$((($(this).parent())[0])).addClass("disabledAttribute")
						}
		
					});
				}
			}
		});
	}
	
	
	/*
	 * Private
	 * Add the table lens effect
	 */
	function tableLens() {
		$("tr").hover(function() {
			if (fishEyeOverlay) {
				var clickedRow = $(this).index();
				var trThis = $("tr").get(clickedRow);
				var size = $("tr").length;
				var upInd = clickedRow;
				var dwnInd = clickedRow;
				var shuffledArray = [];
				shuffledArray.push(clickedRow);
				
				for (var i = 0; i < size - 1; i++) {
					if (upInd > 0) {
						shuffledArray.push(upInd - 1);
						upInd -= 1;
					}
					if (dwnInd < size - 1) {
						shuffledArray.push(dwnInd + 1);
						dwnInd += 1;
					}
					if (upInd < 0 && dwnInd > size)
						break;
				}   
				
				var ht = 1;
				var r = 255;
				var g = 200;
				var b = 255;
				var a = 1.0;

				//make the series
				var quadSeries =[]
				var x = 2;
				var ft = 30;
				for (var i = 0; i < size; i++) {
					var value = x * x * (x + 1) + 5 * x;
					value = value.toFixed(2);
					x -= 0.1;
					quadSeries.push(value);
					$("#tr" + shuffledArray[i]).css("height", value * 15);
					var color = "rgba(" + r + "," + g + "," + b + "," + a + ")";
					a -= 0.05;
					b -= 5;
					if (colorOverlay)
						$("#tr" + shuffledArray[i]).css("background", color); 
					if (i < 3 && colorOverlay) {
						$("#tr" + shuffledArray[i]).css("font-size", "8em");
						$("#tr" + shuffledArray[i]).css("color", "red");
					} else {
						$("#tr" + shuffledArray[i]).css("font-size", ft);
						ft -= 0.05;
					}
				}
			}
		}, function() {
			$("tr").css("color", "black");
		});
	}

})();
