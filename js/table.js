(function() {
	
	/*************************************VARIABLES*************************************/
	
	mar = {};
	var data;
	var opacityScale;
	var columns = [];
	var numericalAttributes = [];
	var userAdjustedAttributesKeys = [];
	var userAdjustedAttributesValues = [];
	var unusedAttributes = [];
	var categoricalAttributeMap = {};
	var attributeWeights = [];
	var legendItems = {};
	var tooltipAttribute;
    var classNameFirstConsoleAttr = "1stconTr";
    var classNameConsoleAttr = "conTr";

    
	var lastChangedRow;
	var changedRows = [];
    var selectedRows = [];
    var interactionValueArray =[];
    var rankScoreValueArray = [];
    var consolechartSortedData = [];

    
	
	var tolerance; 
	var mapBarHeight;
	var minimap_width = 50;
	var console_width = 150;
    var count = 0;
    
	var keys;
	var htmlTableToCache;
	var htmlConsoleToCache; 
	var table, header, rows, cells;
	var minimap, minimap_rows;
	var consolePanel, console_rows;

	var useCategorical = false; 
	var interactionIncrement = 1; 
	var maxInteractionWeight = 0.5;
	var maxRankScore = 1; 
    var timeDie = 1000;

	var showAllRows = true;
	var colorOverlay = true;
	var fishEyeOverlay = true;
    var isDragging = true;
    var rankButtonPressed = false;
    var disallowWeightAdjustment = false;
    var showBarOverlay = true;
    
    var miniChartCache = "";
   
    var attributeStates = {"HIGH" : 1, "LOW" : 2, "UNUSED" : 3};
    
    
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
			opacityScale = d3.scale.linear()
				.domain([0, data.length])
				.range([0.25, 1.0]); 
			tolerance = data.length / 10;
			if (data.length > 0) {
				
				keys = Object.keys(data[0]);
				
				// give each data item a unique id
				var counter = 0; 
				for (var i = 0; i < data.length; i++) {
					data[i]["uniqueId"] = counter + 1; 
					data[i]["rank"] = counter + 1;
					data[i]["oldIndex"] = counter + 1; 
					data[i]["rankScore"] = (data.length - counter + 1) / data.length;
					data[i]["interactionWeight"] = 1;
					counter++;
				}
				
				columns.push({ head: "Rank", cl: "rank index null", html: function(row, i) { return data[i]["rank"]; } });
				columns.push({ head: "Rank Score", cl: "rankScore", html: function(row, i) { return data[i]["rankScore"]; } });
				columns.push({ head: "Old Index", cl: "hidden oldIndex", html: function(row, i) { return data[i]["oldIndex"]; } });
				columns.push({ head: "Unique ID", cl: "hidden uniqueId", html: function(row, i) { return data[i]["uniqueId"]; } });
				columns.push({ head: "Interaction Weight", cl: "interactionWeight", html: function(row, i) { return data[i]["ial"]["weight"]; } });
				
				userAdjustedAttributesKeys.push("interactionWeight");
				userAdjustedAttributesValues.push("Maximum Interaction Weight");
				for(var attr = 0; attr < userAdjustedAttributesKeys.length; attr++) {
					var attrName = userAdjustedAttributesKeys[attr];
					numericalAttributes.push(attrName);
					normalizeAttribute(data, attrName, attributeStates.HIGH);	
				}

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
						columns.push({ head: attrName, cl: attrName.replace(" ", "_", "g") + " numericalAttribute", html: ƒ(attrName)});
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

						/*
						 *The first categorical attribute will be shown on the tooltip for 
						 *Fisheye by convention.
						 */
						if(!tooltipAttribute) {
							tooltipAttribute = attrName;
						}
					}
					normalizeAttribute(data, attrName, attributeStates.HIGH);
				}
			}
			ial.init(data, 0);
			displayTable(data);
			mar.rankButtonClicked(); 
		});

		legendItems = [["#337ab7", "No Changes"],
					   ["rgb(88,218,91)" , "Row has moved up"],
					   ["rgb(218, 91, 88)" ,  "Row has moved sown"],
					   ["rgb(88, 91, 88)" , "Row has been moved"]
					  ];

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
				.attr("id", "miniChart");

			// append the table in the console view for attribute weight visualization
			consolePanel = d3.select("#auxContentDiv")
				.append("table")
				.attr("id", "consoleChart")
				.attr("hidden", "hidden");

			legendPanel = d3.select("#auxContentDiv")
				.append("table")
				.attr("id", "legendChart")
				.attr("hidden", "hidden");

			// append the table header
			header = table.append("thead")
				.attr("class", "header")
				.append("tr")
				.selectAll("th")
				.data(columns)
				.enter()
				.append("th")
				.attr("class", ƒ("cl"))
				.style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; })
				.text(ƒ("head"));

			// append the rows			
			rows = table.append("tbody")
				.selectAll("tr")
				.data(data)
				.enter()
				.append("tr")
				.attr("id",function(d,i){
					return "tr" + i;
				});
			
			// append the rows of the mini map
			minimap_rows = minimap.append("tbody")
				.selectAll("tr")
				.data(data)
				.enter()
				.append("tr")
                .attr("class","miniTr")
                .attr("id",function(d,i){
                return "tr"+i;
                });
 
			// append the rows in the console for each attribute
			console_rows = consolePanel.append("tbody")
				.selectAll("tr")
				.data(numericalAttributes)
				.enter()
				.append("tr")
                .attr("class", function(d,i){
              if(i==0){
                  return classNameFirstConsoleAttr;
              }  else{
                  return classNameConsoleAttr;
              }
            })
                .attr("id", function(d,i) {
                	return "consoleTr" + i;
                });

            legend_rows = legendPanel.append("tbody")
            	.selectAll("tr")
            	.data(legendItems)
            	.enter()
            	.append("tr")
            	.attr("class", "legendItem")
            	.style("border-bottom", "10px solid white");

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
						cell["norm"] = row[c["head"] + "Norm"];
						return cell; 
					});
				}).enter()
				.append("td")
				.style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; });

				cellWidth = 0;
				if(!showBarOverlay)
					cells = cells.html(ƒ("html")).attr("class", ƒ("cl"));
				else {
					cells = cells.html(function(d, i) {
						if(numericalAttributes.indexOf(d.head) < 1) {
							return d.html;
						}

						cellWidth = ($(this).width() < 0) ? 50 : $(this).width() * d.norm;
						if(cellWidth < 10 ) { cellWidth = 10 }

						return "<svg class = ' " + d.cl + "Svg overlayBar"
								+ " id = 'inter'  "
								+ " width = " + ($(this).width() < 0 ? 50 : $(this).width()) + ">"
								//+ "<g " + "x = " + $(this).position().top + " y = " + $(this).position().right + ">"
								+ "<g>"
								+ "<rect id = 'something' class = 'some' width=" 
								+ cellWidth +" height= 50 fill='#"
								+ (i % 2 == 0 ? 'f' : 'a') + "27997'> </rect>"
								+ "<text x = " + "0" + " dy = " + "1.5em" + " fill='white'>" + d.html + "</text>"
								+ "</g>"
								+ "</svg>";
					}).attr("class", ƒ("cl"));
				}

			$("#tablePanel ." + tooltipAttribute).css({"white-space" : "nowrap"});
			var num_rows = cells.length;
			var num_cols = numericalAttributes.length - userAdjustedAttributesKeys.length;

			minimap_width = $("#auxContentDiv").width();
			console_width = $("#auxContentDiv").width();
			
			legend_rows.selectAll("td")
				.data(function(row, i) {
					return [{"fill" : legendItems[i][0], "description" : "Color"},
					{"fill" : "none", "description" : legendItems[i][1]}];
				}).enter()
				  .append("td")
				  .html(function(d) { return d.description; })
				  .attr("height", "10px")
				  .attr("min-width", "50px")
				  .style("color", function(d) { 
				  	if(d.description == "Color") return d.fill;
				  	else return "black";
				  })
				  .style("background-color", function(d) { return d.fill; })
				  .style("border-right", "5px solid white");

			// append mini map cells
			minimap_rows.selectAll("td")
				.data(function(row, i) {
					return [
							{ column: "svg", value: '<svg class = miniMapSvg id = svg' + i  + ' width = ' + minimap_width +  '><rect id = rec'+ i + ' class = miniMapRect width=' +
								minimap_width * (data.length - row["rank"]) / data.length +
								' height="50" fill="' + "#337ab7" + '"/></svg>' }];

				}).enter()
				.append("td")
				.style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; })
				.html(function(d) { return d.value; })
				.attr("height", "10px");

			// append the cells for the console view
			console_rows.selectAll("td")
				.data(function(column, i) {
					colWidth = (1 / num_cols);
					if (column === "interactionWeight") {
						colWidth = 0.5;
						column = "Maximum Interaction Weight";
					}
					return [{ id: i, name: column, amount: colWidth }];
				}).enter()
				.append("td")
				.html(function(d) {
					attributeWeights[d.id] = d.amount;
					return "<p class=columnChartName id=col" + d.id + " title=" + d.title + ">" + d.name + "</p>"; 
				}).append("svg")
				.append("rect")
				.attr("fill", "#337ab7")
				.attr("id", function(d) { return "rect" + d.id; })
				.attr("width", function(d) {
					d.width = (console_width * d.amount);
					d.visibleWidth = d.width;
					return d.width + "px";
				}).attr("title", function(d) { 
					return (d.amount * 100).toFixed(0) + "%"; })
				.attr("height", "10px")
				.call(d3.behavior.drag().on('drag', function(d) {
                    console.log("Hehe :" + d.name);
                
                    if(d == undefined){
                        console.log("Its Undefinded");
                        //d = consolechartSortedData;
                    }
					if (d.name !== "Maximum Interaction Weight" && disallowWeightAdjustment)
						return;

					var new_width = d.width + d3.event.dx;
					if (new_width < 0)
						new_width = 0;

					if (new_width > console_width)
						new_width = console_width;

					d.width = new_width;
					d.visibleWidth = (d.width < 3 ? 3 : d.width);
					//d.visibleWidth = d.width;
					d.amount = new_width / console_width;
					attributeWeights[d.id] = d.amount;
					d3.select(this).attr("width", d.visibleWidth);
					d3.select(this).attr("title", (d.amount * 100).toFixed(0) + "%");

					if (d.name === "Maximum Interaction Weight")
						maxInteractionWeight = d.amount; 
					
					$("#discard_button").removeAttr("disabled");
				}))


				d3.selectAll("#consoleChart svg")
				.on('mouseover', function(d) {
					if(d.visibleWidth >= 10) return;
					$(this).find("rect").attr("width", d.visibleWidth + 10);
				})
				.on('mouseout', function(d) {
					$(this).find("rect").attr("width", d.visibleWidth);
				})

			$("td", "#miniChart").attr("height", "1");
			$("td", "#consoleChart").attr("height", "1");
			$("p", "#consoleChart").css({"min-width" : $("#auxContentDiv").width()});

			mapBarHeight = $("#miniChart svg").height();

			var tableObj = document.getElementById("miniChart");
			while(tableObj.scrollHeight > tableObj.clientHeight && mapBarHeight >= 1) {
				mapBarHeight--;
				$("svg", "#miniChart").height(mapBarHeight);
			}

			$("td.interactionWeight").addClass("tableSeperator");
			$("th.interactionWeight").addClass("tableSeperator")

			addFunctionality(); 
			$("#discard_button").attr("disabled", "disabled");
			
			htmlTableToCache = $("#tablePanel tbody").html(); 
			htmlConsoleToCache = [];
			d3.selectAll("#consoleChart td").each(function(d) {
				htmlConsoleToCache.push(
				 	{
						"amount" : d.amount,
						"width" : d.width,
						"visibleWidth" : d.visibleWidth,
						"name" : d.name,
						"direction" : "directionUp"
					}
				);
			});


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
					cell["norm"] = row[c["head"] + "Norm"];
					return cell; 
				});
			}).style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; })
			.each(function(parentD) {
				cellRef = $(this);

				if(!showBarOverlay || numericalAttributes.indexOf(parentD.head) < 1) {
					d3.select(this).html(ƒ("html"));
					return;
				}

				d3.select(this).select("svg")
							   .attr("width", function(d) {
							   		return $(cellRef).width() < 0 ? 50 : $(cellRef).width();
							   });

				d3.select(this).select("rect").attr("width", function(d) {
					cellWidth = (cellRef.width() < 0) ? 50 : cellRef.width() * parentD.norm;
					return (isNaN(cellWidth) || cellWidth < 10 ? 10 : cellWidth);
				}).html(function(d) { return d.html; });
			});
			
		
		cells = 
			cells.attr("placeHolder", function(d, i) {
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

		$("td.interactionWeight").addClass("tableSeperator");
		$("th.interactionWeight").addClass("tableSeperator")
		widths = [];
		$("th", "#tableId").each(function(d) {
			widths.push(this.getBoundingClientRect().width);
		});

		$("th", ".pseudoHeader").each(function(i, d) {
			$(this).css("min-width", widths[i]);
			
		});	
	}


	/*
	 * Update the mini map 
	 */
	mar.updateMinimap = function() {

		minimap = d3.select("#auxPanel #miniChart");
		minimap_rows = minimap.select("tbody")
			.selectAll("tr")
			.data(data);

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
				        { column: "svg", value: '<svg class = miniMapSvg id = svg' + i  + ' width=' + minimap_width + 
				        '><rect id = rec'+ i + ' class = miniMapRect width=' + minimap_width * row["rankScore"] / maxRankScore
				        	+ ' height="50" fill="' + barColor + '" opacity="' + opacity + '"/></svg>' }];
	
			})
			.style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; })
			.html(function(d) {return d.value; })
			.attr("height",  "10px");

		$("td", "#miniChart").attr("height", "1");
		$("svg", "#miniChart").height(mapBarHeight);
	}

	
	/************************************RANK UTILITY************************************/

	/*
	 * Private 
	 * Update the weights of the attributes based on changes to the bar width
	 */
	function updateColumnWeights(weights) {
        
		totalPercentage = 0;
		if (weights == null) {
			d3.selectAll("#consoleChart td").each(function(d, i) {

                if(d == undefined){
                    //d=consolechartSortedData;
                }
                
                
				if (unusedAttributes.indexOf(i) < 0 &&
						userAdjustedAttributesValues.indexOf($(this).text()) === -1) {
					totalPercentage = totalPercentage + Number(d.amount);             
				}
			});
		}

		// The weights array does not include any user adjusted atrribute weights
		// so they have to be offset so that the iteration index matches correctly.
		offset = userAdjustedAttributesValues.length;
        var objs = d3.selectAll("#consoleChart td");
    
		objs.each(function(d, i) {
            
            if(d == undefined){
                //d = consolechartSortedData;
            }
			if (userAdjustedAttributesValues.indexOf(($(this)).text()) != -1)
				return;

			if (unusedAttributes.indexOf(i) >= 0)
				d.amount = 0;
			else if (weights == null)
				d.amount = d.amount/totalPercentage;
			else {
				d.amount = weights[i - offset];			
			}

			attributeWeights[d.id] = d.amount;

			d.width = (console_width * d.amount);
			d.visibleWidth = (d.width < 3 ? 3 : d.width);
			//d.visibleWidth = d.width;
			$(this).find("rect").attr("width", d.visibleWidth);
			$(this).find("rect").attr("title", (d.amount * 100).toFixed(0) + "%");
        
		});
        
        
   
        
        
        
	}
    



    
/*
 * Sort the Console Chart Bars based on width!
 */

function sortConsoleChartBars() {
      
  var objs = d3.selectAll("#consoleChart tr." + classNameConsoleAttr);

   
  objs.sort(function(a, b) {
      
      var aTd ="";
      var bTd ="";
      
      $("#consoleChart tr." + classNameConsoleAttr + " p").each(function(){
          
          if( a.indexOf($(this).text()) != -1){
              aTd = $(this).closest('td');
          }
          
           if( b.indexOf($(this).text()) != -1){
              bTd = $(this).closest('td');
          }
       
      })
      
     
      
      //console.log("A td is : " + aTd);
      //console.log("B td is : " + bTd);
      var indexAWidth = parseFloat(aTd.find('rect').attr('width'));
      var indexBWidth = parseFloat(bTd.find('rect').attr('width'));
      var indexAtext = aTd.closest('tr').text();
      var indexBtext = bTd.closest('tr').text();
           
  
      ///*
      if(indexAWidth > indexBWidth){
          return -1;
      }else if(indexBWidth > indexAWidth){
          return 1;
      }else{
          return 0;
      }
      
      //*/
      //return indexBWidth - indexAWidth;
      //return d3.descending(indexAWidth,indexBWidth);
      
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
	function getRowsForSVD(clickedRows, watchedRows, numRows) {
		// use the rank values of the rows with the given unique ids
		clickedRows = getRankValues(clickedRows); 
		watchedRows = getRankValues(watchedRows);
		
		if (numRows > data.length) {
			console.log("table.js: cannot get more than " + data.length + " rows");
			return [];
		}
		
		var rowsForSVD = clickedRows.slice();
		for (var i = 0; i < watchedRows.length; i++) {
			if (rowsForSVD.indexOf(Number(watchedRows[i])) < 0)
				rowsForSVD.push(Number(watchedRows[i]));
		}
		var numSurrounding = Math.ceil((numRows - rowsForSVD.length) / clickedRows.length); 
		if (rowsForSVD.length >= numRows)
			return getUniqueIds(rowsForSVD); 
		
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
	 * Get the matrix for the given set of row numbers
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
					if (unusedAttributes.indexOf(j) < 0 
						&& userAdjustedAttributesKeys.indexOf(keys[j]) < 0)
							row.push(currentData[keys[j] + "Norm"]);
			} else {
				for (var j = 0; j < numericalAttributes.length; j++)
					if (userAdjustedAttributesKeys.indexOf(numericalAttributes[j]) >= 0)
						continue;
					else if (unusedAttributes.indexOf(j) < 0 ) {
						row.push(currentData[numericalAttributes[j] + "Norm"]);
					}
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
					if(unusedAttributes.indexOf(j) < 0 && 
						userAdjustedAttributesKeys.indexOf(keys[j]) < 0)
							row.push(currentData[keys[j] + "Norm"]);
			} else {
				for (var j = 0; j < numericalAttributes.length; j++)
					if(unusedAttributes.indexOf(j) < 0 && 
						userAdjustedAttributesKeys.indexOf(numericalAttributes[j]) < 0)
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
	function normalizeAttribute(dataset, attr, attributeState) {
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
			
			if (attributeState == attributeStates.HIGH) {
				for (var i = 0; i < len; i++)
					dataset[i][attr + "Norm"] = (dataset[i][attr] - min) / (max - min);
			} else if (attributeState == attributeStates.LOW) {
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
	 * Weight is normalized in [0, maxInteractionWeight]
	 * Rank is normalized in [0, 1]
	 */
	function normalizeInteractions() {
		var len = data.length;
		var weightMin = Number.MAX_VALUE; 
		var weightMax = Number.MIN_VALUE; 
		var rankMin = Number.MAX_VALUE; 
		var rankMax = Number.MIN_VALUE;
		
		for (var i = 0; i < len; i++) { 
			var currentWeight = Number(data[i].ial.weight);
			var currentRank = Number(data[i]["rank"]);
			
			if (currentWeight < weightMin)
				weightMin = currentWeight; 
			if (currentWeight > weightMax)
				weightMax = currentWeight; 
			
			if (currentRank < rankMin)
				rankMin = currentRank; 
			if (currentRank > rankMax)
				rankMax = currentRank; 
		}
		
		for (var i = 0; i < len; i++) {
			if (weightMin == weightMax)
				data[i].ial.weightNorm = 0;
			else
				data[i].ial.weightNorm = maxInteractionWeight * (Number(data[i].ial.weight) - weightMin) / (weightMax - weightMin);
			data[i].rankNorm = 1.0 - (data[i].rank - rankMin) / (rankMax - rankMin);
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

		for (var i = 0; i < input.length; i++) { 	
			if(max == min) {
				result.push((1.0)/input.length);
			} else {
				result.push((input[i] - min) / (max - min));
			}
		}


		// now normalize so the components sum to 1
		var sum = getSum(result);
		var len = result.length;
		
		for (var i = 0; i < len; i++)
			result[i] = result[i] / sum; 

		// Resplice the unused attributes into the results with a weight of 0
		for (var i = 0; i < attributeWeights.length; i++) {
			if (unusedAttributes.indexOf(i) >= 0) {
				result.splice(i, 0, 0);
			}
		}
		
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

		normalizeInteractions(); // normalize interaction weights and values
		weights = normalize(weights); // normalize weights
		var matrixResult = getMatrix(allRows);

		var matrix = matrixResult[0]; 
		var uniqueIds = matrixResult[1]; 
		var ranked = []; 
		
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
		
		var selectedRowIds = []; 
		for (var i = 0; i < selectedRows.length; i++)
			selectedRowIds.push(getDataByFirstCategoricalAttr(selectedRows[i])["uniqueId"]);
		var changedRowIdsForSVD = getChangedRows();
		var b = getRowsForSVD(changedRowIdsForSVD, selectedRowIds, numericalAttributes.length + 1); 

		if (b.length <= keys.length) {
			// make sure the weights are updated
			updateColumnWeights(null);
			retArray = attributeWeights.slice();
			retArray.splice(0, 1);
			var normalizedWeights = normalize(retArray);
			return normalizedWeights;
		}
		
		//TODO: THIS HAS TO RETURN SOMETHING OR BE CHECKED BY CALLER!!
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
	function updateColorAndOpacity(rowObj, oldMiniRowObj, newMiniRowObj, oldIndex, newIndex) {
		var opacity = opacityScale(Math.abs(Number(newIndex) - Number(oldIndex)));
		if (newIndex == oldIndex)
			opacity = 0;

		color = '';

		if(rowObj.hasClass('greenColorChange'))
			color = 'rgba(88, 218, 91, ';
		else if (rowObj.hasClass('redColorChange'))
			color = 'rgba(218, 91, 88, ' ;

		if (colorOverlay) {
				rowObj.css("background-color", color + opacity + ')');
				newMiniRowObj.css("fill", color + '1)');
		}

		oldWidth = newMiniRowObj.attr("width");
		newMiniRowObj.attr("width", oldMiniRowObj.attr("width"));
		oldMiniRowObj.attr("width", oldWidth);
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
	 * Get the data item using its first categorical attribute
	 */
	function getDataByFirstCategoricalAttr(attrVal) {
		for (var i = 0; i < data.length; i++) {
			if (data[i][tooltipAttribute] == attrVal)
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

		legendTab = $("#auxPanel #legendTab");
		legendTab.toggleClass("active");
	}	
	
	
	/**************************************INPUTS**************************************/
	
	/*
	 * Return the table to its state before changes were made
	 */
	mar.discardButtonClicked = function() {
		console.log("table.js: Discarding Changes"); 
		$("#tablePanel tbody").html(htmlTableToCache);

		prevStates = [];
		d3.selectAll("#consoleChart rect").each(function(d, i) {
			d.name = htmlConsoleToCache[i].name;
			d.amount = htmlConsoleToCache[i].amount;
			d.width = htmlConsoleToCache[i].width;
			d.visibleWidth = htmlConsoleToCache[i].visibleWidth;

			attributeWeights[d.id] = d.amount;
			d3.select(this).attr("width", d.visibleWidth);
			d3.select(this).attr("title", (d.amount * 100).toFixed(0) + "%");

			if (d.name == "Maximum Interaction Weight") {
				maxInteractionWeight = d.amount; 
			} else {
				prevStates.push(htmlConsoleToCache[i].direction);
			}
		});

		handleArrowClicks(null, prevStates);

		greyMinibars(false); // make sure the attribute weights are adjustable again
		selectedRows = [];
        handleClickedRow();
        setTimeout(function() {       
            $('#tablePanel tbody tr').animate({ backgroundColor: "white" }, 1000);
        }, timeDie);
        $("#discard_button").attr("disabled","disabled");
	}
	
	
	/*
	 * Rank!
	 */
	mar.rankButtonClicked = function() {
        rankButtonPressed = true;
       
        greyMinibars(false);
		console.log("table.js: Ranking"); 
		var normalizedWeights = runSVD();
		var ranking = computeRanking(normalizedWeights);

		// update oldIndex to the old rank position and update rank
		for (var i = 0; i < ranking.length; i++) {
			var id = Number(ranking[i]["id"]);
			var obj = getDataByUniqueId(id);
			
			obj["oldIndex"] = obj["rank"]; 
			obj["rank"] = i + 1;
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
        
		updateColumnWeights(normalizedWeights.slice());	
        sortConsoleChartBars();
     
		//console.log("A (" + A.length + " x " + A[0].length + "): " + JSON.stringify(A));
		//console.log("b (" + b.length + "): " + b);
		//console.log("Weight: " + weights);
		//console.log("table.js: Ranking - " + JSON.stringify(ranking)); 
             
        getRankScores();
        getInteractionWeights();
        var normInterArray = normalizeArray(interactionValueArray)
        enableBarsOnCols("td.interactionWeight.tableSeperator", normInterArray, interactionValueArray, 0);   
        var normRankArray = normalizeArray(rankScoreValueArray);
        enableBarsOnCols("td.rankScore", normRankArray, rankScoreValueArray, 1);
        updateRowFont("");
        selectionUpdatedMiniBar();
        rankButtonPressed = false;
        setTimeout(function() {       
            $('#tablePanel tbody tr').animate({ backgroundColor: "white" }, 1000);
        }, timeDie);
       
        htmlTableToCache = $("#tablePanel tbody").html(); 
        htmlConsoleToCache = [];
		d3.selectAll("#consoleChart td").each(function(d) {
            //console.log(d)
        	direction = "directionUp";
        	pObj = $(this).find("input");
        	if(pObj.hasClass("directionUp"))
        		direction = "directionUp";
        	else if (pObj.hasClass("directionDown"))
        		direction = "directionDown";
        	else if (pObj.hasClass("unusedRow"))
        		direction = "unusedRow";

	               if ( d == undefined){
                            //d = consolechartSortedData;
                    }
        	htmlConsoleToCache.push(
                        {
						"amount" : d.amount,
						"width" : d.width,
						"visibleWidth" : d.visibleWidth,
						"name" : d.name,
						"direction" : direction
					});
        });
        
        $("#discard_button").attr("disabled", "disabled");
        console.log("Ranking Done");
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
		
		$("#legendChart").css({"display" : "none"});
		$("#miniChart").css({"display":"none"});
		$("#consoleChart").css({"display":"block"});
	}

	/*
	 * Toggle to the mini map tab
	 */
	mar.changeToMinimap = function() {
		toggleActiveTab();

		$("#legendChart").css({"display" : "none"});
		$("#consoleChart").css({"display":"none"});
		$("#miniChart").css({"display":"block"});
	}
	

	mar.changeToLegend = function() {
		toggleActiveTab();
		$("#consoleChart").css({"display":"none"});
		$("#miniChart").css({"display":"none"});
		$("#legendChart").css({"display" : "block"});
	}
	
	
	/***********************************TABLE EFFECTS***********************************/
	
	/*
	 * Private
	 * Add functionality:
	 *     click & drag rows
	 *     add arrows to indicate desired values
	 *     table lens 
	 *     fixed header row
	 *     tooltips
	 *     bars in table
	 */ 
	function addFunctionality() {
		clickAndDragRows(); 
		addArrows(); 
        tablelens();
        handleClickedRow();
        
        //addFixedHeader();
        enableConsoleChartTooltips();
        drawBars();

	}
    
	


    
    
    /*
     * Private
     * Draw the bars in the main table
     */
    function drawBars() {
          if (count == 0) {
            
            // handle bars for interaction weights
            tag = 0;
            getInteractionWeights();
            var normInterArray = normalizeArray(interactionValueArray)
            enableBarsOnCols("td.interactionWeight.tableSeperator", normInterArray, interactionValueArray, tag^=1);
            
            // handle bars for rank scores
            getRankScores();
            var normRankArray = normalizeArray(rankScoreValueArray);
            enableBarsOnCols("td.rankScore", normRankArray, rankScoreValueArray, tag^=1);
            count +=1;
        }
    }
    
    
    /*
     * Private
     * Populate rankScoreValueArray
     */
    function getRankScores() {
    	var classRankScore = "td.rankScore";
    	var ind = 0;
    	rankScoreValueArray = [];
    	$(classRankScore).each(function() {
    		if (ind > -1 && ind <= interactionValueArray.length) { 
    			var rankScoreValue = $(this).text(); 
    			rankScoreValueArray.push(parseFloat(rankScoreValue));                 
    		}          
    		ind += 1;
    	});
    }
    
    function getValueArrayByColumn(selector) {
    	arr = [];
    	$(selector).each(function() {
    		var val = $(this).text();
    		arr.push(parseFloat(val));
    	});

    	return arr;
    }
    
    /*
     * Private
     * Populate interactionValueArray
     */
    function getInteractionWeights() {
        interactionValueArray = [];
    	var classInteractionCol = "td.interactionWeight.tableSeperator";
    	$(classInteractionCol).each(function() {
    		var interWeight = $(this).text(); 
    		interactionValueArray.push(parseFloat(interWeight));   
            //console.log("Weight: " + parseFloat(interWeight));
    	});  
        //console.log("################################################################");
    }
    
    
    /*
     * Private
     * Normalize the input array
     */
    function normalizeArray(arrObject) {
    	var epsilon = 1;
    	var epsilon2 = 0.75;
    	var maxWeight =  parseFloat(Math.max.apply(Math, arrObject));           
    	if (maxWeight == 0) 
    		maxWeight = epsilon;
    	var normalizedArray = arrObject.map(function(x) { 
    		if (x == 0) 
    			x = epsilon2;
    		return x / maxWeight; 
    	});

    	return normalizedArray;
    }

    /*
     * Private
     * Normalize the dataset and return all normd columns
     */
     function normalizeDataset(datas) {
     	var epsilon = 1;
     	var epsilon2 = 0.75;
     	var normd = [];
     	var datasetKeys = Object.keys(datas[0]);

     	for(var row = 0; row < datas.length; row++)
     		normd[row] = {};

     	for(var attrKey = 0; attrKey < datas.length; attrKey++) {

     		var attr = datasetKeys[attrKey];
     		var maxWeight = parseFloat(Math.max.apply(Math, datas.map(
     															function(d) {
     																return d[attr];
     															})));
     		if(maxWeight == 0)
     			maxWeight = epsilon;

     		for(var row = 0; row < datas.length; row++) {
     			if(datas[row][attr] == 0)
     				normd[row][attr] = epsilon2/maxWeight;
     			else
     				normd[row][attr] = datas[row][attr]/maxWeight;
     		}
     	}
     }
    
    /*
     * Private 
     * Enable bars in the main table
     */
    function enableBarsOnCols(selector, normalizedArray, itemArray, tag) {
    	var colorValue = "";
    	var str = "";
    	
    	if (tag == 0) {
    		// interaction weight
    		colorValue = "a";
    	} else {
    		// rank score
    		colorValue = "f";
    	}
    	
    	var item = 0;
    	var prevWidth = 0;
    	$(selector).each(function() {
			var tdWidth = $(this).width() * normalizedArray[item];
			if (isNaN(tdWidth)) 
				tdWidth = prevWidth;

			var current = $(this).text();
			var content = "<p class = 'textToHide'>"+current +"</p><svg class = ' " + selector + "'Svg' id = 'inter'  width = " + tdWidth+"><rect id = 'something' class = 'some' width=" + tdWidth+" height= 50 fill='#" + colorValue + "27997'/></svg>"; 
			$(this).html(content);
			ttText = itemArray[item];

			$(this).tooltip();        
			$(this).attr("title", ttText);            
			$(this).tooltip({
				tooltipClass: "tooltipInteraction",
			});
			
			$(this).tooltip({
				position: {
					my: "left top",
					at: "center top"
				}
			});
			
			item += 1;
			prevWidth = tdWidth;
    	});
    	//$(".textToHide").css('font-size', 0);  
 		$(".textToHide").hide();  

    }
    

	/*
	 * Private
	 * Enables tooltips on the console chart
	 */
	function enableConsoleChartTooltips() {
		$("#consoleChart svg").tooltip({
				track:true
		});
	}


	/*
	 * Private
	 * Adds a pseudo header that floats above the table when scrolling.
	 */
	function addFixedHeader() {
		$("#tableId .header").css({"color":"white"});
		d3.select("#tableId").append("div").attr("class", "pseudoDivWrapper");		
		$("#tableId thead").clone().attr("class", "pseudoHeader").removeClass("header").appendTo(".pseudoDivWrapper");

		widths = [];
		$("th", "#tableId").each(function(d) {
			widths.push(this.getBoundingClientRect().width);
		});

		var headerOffset = $(".pseudoDivWrapper").position().left;
		var headerStart = $("#tablePanel").position().left;

		$("th", ".pseudoHeader").each(function(i, d) {
			$(this).css("min-width", Math.floor(widths[i]));
		});

		$("#tablePanel table").scrollTop(0)
		$(".pseudoHeader").css({"overflow-x":"hidden", "max-width":"100%"});
		$("#tablePanel .pseudoDivWrapper").css({"height" : $("#tablePanel tbody").position().top});
		$(".pseudoDivWrapper").css({"position":"absolute", "overflow-x" : "hidden", "top": 0, "left": headerStart});
		$("#tableId").scroll(function() {
			$(".pseudoDivWrapper").css({"left" : headerOffset - $(this).scrollLeft()});
		});
	}

	
	/*
	 * Private
	 * Handler for clicked row
	 */
	function handleClickedRow() {
		var defFontWeight = $("#tr1").css('font-weight');

		updateClickedItem();
		//updateRowFont("");

		$('#tableId tr').click(function(event) {
            
			if (event.shiftKey) {
				var item = $(this).index();
				//console.log("item value: " + item);
				isDragging = false;
				var teamName = "";
				var tx = 0;
				
				$('.' + tooltipAttribute).each(function() {
					tx += 1;
					if (item == tx - 2)              
						teamName = $(this).text(); 
				});

				var index = selectedRows.indexOf(teamName);
				if (index > -1) {
					selectedRows.splice(index, 1);
					updateRowFont(teamName);
				}
			} else
				isDragging = true;
                
		});
	}


	/*
	 * Private
	 * Update a clicked item
	 */ 
	function updateClickedItem() {   
		$('#tableId tr').mousedown(function() {
			isDragging = true;
			var item = $(this).index(); 
			highlightItems(item);
			$("#discard_button").removeAttr("disabled");
		}).mouseup(function() {  
			shiftMode = true;
		});        

		function highlightItems(item) {
			if (isDragging == true ) {
				var teamName = "";
				var tx = 0;
				$('.' + tooltipAttribute).each(function() {
					tx += 1;
					if (item == tx - 2)
						teamName = $(this).text(); 
				});

				$("#tr" + item).attr("id", teamName);
                editSelectedRowItems(teamName);
				selectedRows.push(teamName);
				selectedRows = selectedRows.filter(function(item, ps) {
					return selectedRows.indexOf(item) == ps;
				});
                //console.log("Selected rows: " + selectedRows);
				updateRowFont(teamName);
			}
		}
	}    

	/*
	 * Private
	 * Updates the rows of mini bar as grey color, when main table rows are selected
	 */
	function selectionUpdatedMiniBar(){


		miniChartCache = $("tr .rank.index.null").html();
		var iter = 0;
		$("tr .rank.index.null").each(function() {
			var backColor = $(this).css("background-color");
			var backColor2 = $(this).css("background");
			backColor2 = backColor2.substring(0, 15);
			if (backColor == "rgb(255, 255, 255)" || backColor == "rgba(0, 0, 0, 0)") {

			} else {
				var id = iter - 1;

				//$("#rec" + id).css("fill", "#bdbdbd");
				var elemTr = $("#rec" + id).closest('tr');
				var elemTrId = elemTr.attr('id');
				//console.log("tr id is : " + elemTrId);
				//console.log("++++++++++++++++++++++++++++++++++++++++++");

				var dotId = elemTrId + " Dotted";
				var ind = elemTrId.indexOf(" Dotted");
				if (ind == -1) {
					var recWidth = $("#rec" + id).attr("width");
					var newWidth = 1 * recWidth;
					$("#rec" + id).css("width", newWidth);
					//var recTop = $("#rec" + id).position().top - 210;
					//var recLeft = $("#rec" + id).position().left;
					var addCircle = "<rect id='Dot' class='miniDotSvg' width='5' height='10' fill='black'></rect>";
					//var addCircle ="<circle id='Dot' class='miniDot' cx = "+recLeft+ " cy= " + recTop + " r = '10' stroke='black' stroke-width='1' fill='red'/>>";
					var elemTd = $("#rec" + id).closest('svg');
					var elemTdHtml = "" + elemTd.html() + addCircle;
					elemTd.html(elemTdHtml);
					elemTr.attr('id', elemTrId + " Dotted");
				}
			}

			if (backColor2 === "rgb(99, 99, 99)")
				var id2 = iter - 1;

			iter += 1;
		});

		$("#miniChart tr").css("color", "black");
		$("#miniChart svg").css("height", mapBarHeight);
		$("#miniChart rect").css("height", mapBarHeight);
	}
    
    
    /*
	 * Private
	 * Updates the selected row array based on if you have clicked on a watched row again or not
	 */
    function editSelectedRowItems(teamName){
        var index  = -1;
        for(var i=0;i<selectedRows.length;i++){
            if(teamName == selectedRows[i]){
                //console.log("found the team name which was before : " + teamName + "index is : " + i);
                index = i;
            }
        }
        
        if(index>-1){
            //console.log("selected row before : " + selectedRows);
            selectedRows.splice(index, 1);
            selectedRows.push(teamName);
            //console.log("selected row after : " + selectedRows);
        }
    }
	
	/*
	 * Private
	 * Update the font of the given row
	 */
	function updateRowFont(teamName) {
        var greyColor = "#bdbdbd";
        var darkGreyColor = "#636363";
		var defFontSize = $("#tr1").css('font-size');
		var defFontWeight = $("#tr1").css('font-weight');
		//$("tr").css("font-size", defFontSize);
		$("tr").css("font-weight", defFontWeight);
		//$("tr .rank.index.null").css("background", "white");
        //$("tr .rank.index.null").css("color", "black");
        
                
        var iter =0;
        $("tbody tr .rank.index.null").each(function() {
            if(iter>0){
               $(this).css("background", "white");
               $(this).css("color", "black");
            }  
            iter += 1;
            });
        
		for (var i = 0; i < selectedRows.length; i++) {
			$('.' + tooltipAttribute).each(function() {
				if (selectedRows[i] == $(this).text()) {
					var idValTr = $(this).closest('tr');
                    
                    
					var rankCol = $(this).closest('tr').find('.rank.index.null');
                    var idThis = $(this).closest('tr').attr('id');
                  
                   
                   
                    
                    //ELSE CURRENT ROW IS NOT GREY
                    
					if (i == selectedRows.length - 1) {
						idValTr.css("color", "black");
						idValTr.css("font-weight", "900");
                        
                        var styleContent = "color: rgb(255, 255, 255); background: rgb(99, 99, 99);"
                        rankCol.attr("style", styleContent);
					} else {
                        var styleContent = "color: rgb(0, 0, 0); background: rgb(189, 189, 189);"
                        rankCol.attr("style", styleContent);
                       
					}
                    
				}
			});
		} 
        
      
	}
	
   
	/*
	 * Private
	 * Add the fisheye effect to the mini-map
	 */
	function tablelens() {

		var defTrHeight = $(".miniTr")[0].offsetHeight;
		var defSvgHeight = $(".miniMapSvg")[0].offsetHeight;
		var defFontSize = $("#tr1").css('font-size');


		$(".miniTr").hover(function() {
			var clickedRow = $(this).index();
			$('.' + tooltipAttribute).attr("id", tooltipAttribute + clickedRow);
			var teamName = "";
			var tn = 0;
			$('.' + tooltipAttribute).each(function() {
				tn += 1;
				if (clickedRow == tn - 2)
					teamName = $(this).text(); 
			});

			var rankScore = "";
			var rs = 0;
			$('.rankScore').attr("id", "rankScore" + clickedRow);
			$('.rankScore').each(function() {
				rs += 1;
				if (clickedRow == rs -1)
					rankScore = rankScoreValueArray[clickedRow];
                    
			});

			$(".miniTr" ).tooltip();        
			var toolText = "(" + (clickedRow + 1) + ") "+ teamName + "; Rank Score: " + rankScore;
			$(".miniTr" ).attr("title", toolText);

			$('.miniTr').tooltip({
				tooltipClass: "tooltipTest",
			});

			$(".miniTr").tooltip({
				position: {
					my: "right top",
					at: "center top"
				}
			});


			if (!fishEyeOverlay) {
				var trThis = $(".miniTr").get(clickedRow);
				var size = $(".miniTr").length;
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
				var inc = 6;
				var ft = 30;
				for (var i = 0; i < size; i++) {
					var value = (x * (x * x + x) + 2 * x);
					value = value.toFixed(2);
					x -= 0.2;
					if (value > 150) 
						value = 150;
					if (value < 1) 
						value = 1;
					
					quadSeries.push(value);
					$("#svg"+shuffledArray[i]).css("height", value*5);
					$("#rec"+shuffledArray[i]).css("height", value*5);
				}
			}

			if (!fishEyeOverlay) {
				$(".miniTr").css('height', defTrHeight);
				$(".miniTr").css('font-size', defFontSize);
				$(".miniTr").css('background', "white");
				$(".miniTr").css('color', "black");
				$(".miniMapSvg").css('height',defSvgHeight);
			}
		}, function() {
			$("#miniChart tr").css("color", "black");
			$("#miniChart svg").css("height", mapBarHeight);
			$("#miniChart rect").css("height", mapBarHeight);
		});
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

			greyMinibars(true);
			lastChangedRow = tr;
			changedRows.push(Number(tr.find("td.uniqueId").html()));
			return $helper;
		};
		
		var updateIndex = function(e, ui) {
			var id = Number(ui.item.find("td.uniqueId").html());
			var dataItem = getDataByUniqueId(Number(id));
           
			var w = interactionIncrement; 
			if (Number(dataItem["rank"]) == Number(ui.item.index()) + 1) 
				w = 0;
           
			if (w == interactionIncrement)
                interactionValueArray[Number(ui.item.index())] += interactionIncrement;
			
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
            getInteractionWeights();
            //console.log("Interaction Value Array now is : " + interactionValueArray);
            var normInterArray = normalizeArray(interactionValueArray)
            enableBarsOnCols("td.interactionWeight.tableSeperator", normInterArray, interactionValueArray,0);
		};


		$("#tablePanel tbody").sortable({
		    helper: fixHelperModified,
		    stop: updateIndex
		}).disableSelection();
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

			if ((showAllRows == false && changedRows.indexOf(Number(uniqueId)) == -1) ||
					(newIndex == oldIndex)) {
				$(this).removeClass('greenColorChange');
				$(this).removeClass('redColorChange');
				$(this).animate({ backgroundColor: "transparent" }, 1000);
				return true;
			} else if (newIndex > oldIndex) {
				$(this).removeClass('greenColorChange');
				$(this).addClass('redColorChange');
			} else if (newIndex < oldIndex) {
				$(this).removeClass('redColorChange');
				$(this).addClass('greenColorChange');
			}
			
			oldMiniRow = $("#miniChart #tr" + (oldIndex - 1) + " rect");
			newMiniRow = $("#miniChart #tr" + (newIndex - 1) + " rect");
			updateColorAndOpacity($(this), oldMiniRow, newMiniRow, oldIndex, newIndex);  
		});
        
        if (!rankButtonPressed)
           selectionUpdatedMiniBar();  
	}

	/*
	 * Private
	 * grey out the bars on the mini map and disable drag interaction
	 */
	function greyMinibars(greyOut) {
		disallowWeightAdjustment = greyOut;
		var blueColor = "#337ab7";
		var greyColor = "rgb(88, 91, 88)";

		$("#consoleChart rect").each(function(i, d) {
			if (i < userAdjustedAttributesKeys.length) 
				return;

			if (greyOut){                
				$(this).attr("fill", greyColor);
                 }
			else{
                $(this).attr("fill", blueColor);
            }
				
		});
	}
	
	/*
	 * Private
	 * Toggle the arrow for the given attribute to be up or down
	 */
	function toggleRowItemState(clickedObj, toState) {

		if(toState != null) {
			clickedObj.removeClass("directionUp");
			clickedObj.removeClass("directionDown");
			clickedObj.removeClass("unusedRow");
			clickedObj.addClass(toState);
			return;
		}


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
			if (i > 4) { // don't add arrows for the attributes we define
				var html_text = $(this).html();
				if (numericalAttributes.indexOf(html_text) > -1) {
					consoleRow = $("#consoleChart td").filter(function() {
						return $(this).find("p").text() === html_text;
					});
					html_text = '<input type="image" src="img/arrow-up.png" width=15px class="directionUp"/>' + html_text;
					$(consoleRow.find("p")).html(html_text);
					handleArrowClicks(consoleRow, null);
					
				}
			}
		});
	}

	function handleArrowClicks(consoleRow, states) {
		if(states == null) {
			$(consoleRow.find("p")).off("click");
			$(consoleRow.find("p")).click(function() {
				var clickedObj = $(this).find("input")[0];
				var clickedRowName = $(consoleRow).text();
				if(states == null)
					toggleRowItemState($(clickedObj), null);

				if ($(clickedObj).hasClass('directionUp')) {
					$(clickedObj).attr('src', 'img/arrow-up.png');
					$((($(this).parent())[0])).removeClass("disabledAttribute");

					// Column ids are represented as col0, col1.., so this regex parses that
					id = $(this).attr("id");
					unusedAttributes.splice(unusedAttributes.indexOf(parseInt(id.replace(/[^0-9\.]/g, ''), 10)), 1);
					// re-normalize the attribute
					normalizeAttribute(data, clickedRowName, attributeStates.HIGH);
				} else if ($(clickedObj).hasClass('directionDown')) {
					$(clickedObj).attr('src', 'img/arrow-down.png');
					// re-normalize the attribute
					normalizeAttribute(data, clickedRowName, attributeStates.LOW);
				} else if ($(clickedObj).hasClass('unusedRow')) {
					$(clickedObj).attr('src', 'img/remove.png');
					$((($(this).parent())[0])).addClass("disabledAttribute");

					id = $(this).attr("id");
					unusedAttributes.push(parseInt(id.replace(/[^0-9\.]/g, ''), 10));
				}
				
				$("#discard_button").removeAttr("disabled");
			});
		}

		//quick hack to get direction caching to work. this should be integrated
		//with the above code because its just a duplicate - TODO
		if(states != null) {
			$("#consoleChart").find("input").each(function(i) {
				var clickedObj = $(this);
				var pObj = $(this).parent();
				var clickedRowName = pObj.text();
				toggleRowItemState($(clickedObj), states[i]);
				if ($(clickedObj).hasClass('directionUp')) {
					$(clickedObj).attr('src', 'img/arrow-up.png');
					$(((pObj.parent())[0])).removeClass("disabledAttribute");

					// Column ids are represented as col0, col1.., so this regex parses that
					id = pObj.attr("id");
					unusedAttributes.splice(unusedAttributes.indexOf(parseInt(id.replace(/[^0-9\.]/g, ''), 10)), 1);
					// re-normalize the attribute
					normalizeAttribute(data, clickedRowName, attributeStates.HIGH);
				} else if ($(clickedObj).hasClass('directionDown')) {
					$(clickedObj).attr('src', 'img/arrow-down.png');
					// re-normalize the attribute
					normalizeAttribute(data, clickedRowName, attributeStates.LOW);
				} else if ($(clickedObj).hasClass('unusedRow')) {
					$(clickedObj).attr('src', 'img/remove.png');
					$(((pObj.parent())[0])).addClass("disabledAttribute");

					id = pObj.attr("id");
					unusedAttributes.push(parseInt(id.replace(/[^0-9\.]/g, ''), 10));
				}

			});
		}
	}


})();