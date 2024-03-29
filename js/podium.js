(function() {
	
	/*************************************VARIABLES*************************************/
	
	mar = {};

	/*Object holds data after it's loaded*/
	var data;

	/*Arrays and variables to hold column values based on their type*/
	var columns = [];
	var numericalAttributes = [];
	var userAdjustedAttributesKeys = [];
	var userAdjustedAttributesValues = [];
	var unusedAttributes = [];
	var attributeStatesMap = {};
	var categoricalAttributeMap = {};
	var attributeWeights = [];
	var tooltipAttribute;

	/*Arrays and variables to hold rows*/
	var lastChangedRow;
	var changedRows = [];
    var selectedRows = [];

    /*Arrays and variables to hold data values*/
    var rowRankingScores = [];
    var interactionValueArray =[];
    var rankScoreValueArray = [];
    var consolechartSortedData = [];
    var miniCharWidthValues = [];
    var tableColumnWidthValues = {};
    var expectedBarWidthValues = [];
	var keys;

    /*Variables to hold cached data*/
    var htmlTableToCache;
	var htmlConsoleToCache; 
    var miniChartCache;

    /*Variables for holding global values used in the app*/
	var tolerance; 
	var mapBarHeight;
    var count = 0;
    var opacityScale;
	var maxRankScore = 1; 
	var maxInteractionWeight = 0.5;
    var paddingMiniBars = 2;
    var minWidthTDTH =75;

    /*Objects and variables to hold table, minimap,and console content*/
	var table, header, rows, cells;
	var minimap, minimap_rows;
	var consolePanel, console_rows;
    
    /*Constant class names*/
    var classNameFirstConsoleAttr = "1stconTr";
    var classNameConsoleAttr = "conTr";

    /*Variables for size values*/
    var defFontSize;
    var defFontWeight;
    var minimap_width = 50;
    var console_width = 150;

    /*Fixed constant values*/
	const timeDie = 1000;
	const interactionIncrement = 1;

	 /*State variables*/
    
    //State that rows are being dragged
    var isDragging = true;

    //State that the rank button was pressed
    var rankButtonPressed = false;

    //State that weight values are fixed or moveable
    var disallowWeightAdjustment = false;

    //State to hold which tab is currently activated
    var currentActiveTab = TABS.MINIMAP;


	/*Options for the app*/

	//Use Categorical Attributes in ranking
	var useCategorical = false; 

	//show rows that were moved by user, or moved as a consequence
	var showAllRows = true;

	//show color gradient over how much rows moved
	var colorOverlay = true;

	//show fish eye overlay on minimap
	var fishEyeOverlay = true;

    //Show overlayed bars on top of all attributes
    var showBarOverlay = false;
    
    //Show overlayed Expected Value Line 
    var showExpectedValueOverlay = false;
    
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
						columns.push({ head: attrName, cl: getNonSpacedString(attrName) + " numericalAttribute", html: ƒ(attrName)});
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
					setWidthNormValues(data, attrName);
				}

		        for(var i = 0; i < data.length; i++) {
		        	rowRankingScores.push(i+1);
		        }

			}
			ial.init(data, 0);
			displayPage(data);
			mar.rankButtonClicked(); 
			mar.makeMiniRowsDefaultColor();
		});
	}

	/* Display the Legend based on the LegendItems data structure
     *
	*/
	
	function displayLegend() {

		//Add legend by appending the panel, rows, and individual cells
		legendPanel = d3.select("#auxContentDiv")
				.append("table")
				.attr("id", "legendChart")
				.attr("hidden", "hidden");

		legend_rows = legendPanel.append("tbody")
            	.selectAll("tr")
            	.data(legendItems)
            	.enter()
            	.append("tr")
            	.attr("class", "legendItem");
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
				  	else return COLORS.SLATE;
				  })
				  .style("background-color", function(d) { return d.fill; });
	}
	
	/*
	 * Display the Minimap by adding it to the Auxilary panel
	 */

	function displayMinimap() {

		//add minimap panel, rows, and cells
		minimap_width = $("#auxContentDiv").width();
		minimap = d3.select("#auxContentDiv")
				.append("table")
				.attr("id", "miniChart");

		minimap_rows = minimap.append("tbody")
				.selectAll("tr")
				.data(data)
				.enter()
				.append("tr")
                .attr("class","miniTr")
                .attr("id",function(d,i){
                return "tr"+i;
                });

		minimap_rows.selectAll("td")
				.data(function(row, i) {
					mini_width = minimap_width * (data.length - row["rank"]) / data.length;
					mini_width = (mini_width < 1 ? 1 : mini_width);
					miniCharWidthValues.push(mini_width);
					return [
							{ column: "svg", value: '<svg class = miniMapSvg id = svg' + i  + ' width = ' + minimap_width +  '><rect id = rec'+ i + ' class = miniMapRect width=' +
								 + mini_width +
								' height="50" fill="' + COLORS.MINIMAP_ROW + '"/></svg>'}];

				}).enter()
				.append("td")
				.style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; })
				.html(function(d) { return d.value; })
				.attr("height", "10px");

		$("td", "#miniChart").attr("height", "1");
		$("td", "#consoleChart").attr("height", "1");
		$("p", "#consoleChart").css({"min-width" : $("#auxContentDiv").width()});

		mapBarHeight = $("#miniChart svg").height();

		//Decrease minimap row size until it fits on the page
		var tableObj = document.getElementById("miniChart");
		while(tableObj.scrollHeight > tableObj.clientHeight && mapBarHeight >= 1) {
			mapBarHeight--;
			$("svg", "#miniChart").height(mapBarHeight);
		}

		mapBarHeight--;
		if(mapBarHeight > 0) $("svg", "#miniChart").height(mapBarHeight);

	}


	/*
	 * Display the console chart on the Auxilary panel.
	 */

	function displayConsole() {
		var num_cols = numericalAttributes.length - userAdjustedAttributesKeys.length;

		//add console chart panel, rows, and individual cells
		consolePanel = d3.select("#auxContentDiv")
				.append("table")
				.attr("id", "consoleChart")
				.attr("hidden", "hidden");
		
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

		console_width = $("#auxContentDiv").width();

		//For each row, a SVG is added ofwidth proportional to to number of rows
		//A drag behavior is added to svgs, controlling their widths
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
				.attr("fill", COLORS.CONSOLE_ROW)
				.attr("id", function(d) { return "rect" + d.id; })
				.attr("width", function(d) {
					d.width = (console_width * d.amount);
					d.visibleWidth = d.width;
					return d.width + "px";
				}).attr("title", function(d) { 
					return (d.amount * 100).toFixed(0) + "%"; })
				.attr("height", "10px")
				.call(d3.behavior.drag().on('drag', function(d) {                

					//Dragging updates the width, and sets the amount based on how much it's moved.

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

			//On hover, change the width of the svg so its easier to drag, decrease on drag-out.
			d3.selectAll("#consoleChart svg")
				.on('mouseover', function(d) {
					if(d.visibleWidth >= 10) return;
					$(this).find("rect").attr("width", d.visibleWidth + 10);
				})
				.on('mouseout', function(d) {
					$(this).find("rect").attr("width", d.visibleWidth);
				})

			//cache the console chart by saving all datum values.
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
	}

	/*
	 * Display the main table by adding it to the main table.
	 */

	function displayTable() {
		table = d3.select("#tablePanel")
				.insert("table", ":first-child")
				.attr("id", "tableId")
				.attr("class", "table");

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

		rows = table.append("tbody")
				.selectAll("tr")
				.data(data)
				.enter()
				.append("tr")
				.attr("id",function(d,i){
					return "tr" + i;
				});

		//Add cells to the table
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
						cell["WidthNorm"] = row[c["head"] + "WidthNorm"];
						return cell; 
					});
				}).enter()
				.append("td")
				.style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; });

				//If bar overlay is disabled, return just the cell value,
				//else, add DIV to display the value instead.
				cellWidth = 0;
				if(!showBarOverlay)
					cells = cells.html(ƒ("html")).attr("class", ƒ("cl"));
				else {
				    expectedBarValues = getExpectedValuesArray(rowRankingScores);
				    expectedBarWidthValues = expectedBarValues.slice();
				    rowNum = 0;
				    colNum = 0;
				    offset = columns.length - numericalAttributes.length + userAdjustedAttributesKeys.length;
				    expectationBarWidth = 1;
					cells = cells.html(function(d, i) {
						if(numericalAttributes.indexOf(d.head) < 1) {
							return d.html;
						}
						//expectationValue = (expectedBarValues[i-offset][rowNum] * d.norm)/parseFloat(d.html);
						expectationValue = (expectedBarValues[colNum][rowNum]);
						
						cellWidth = ($(this).width() <= 0) ? 50 : $(this).width() * d.WidthNorm;
						
						//exCellLeft = ($(this).width() < 0) ? 50 : $(this).width() * expectationValue;
						exCellLeft = $(this).width() * expectationValue;
						//exCellLeft = exCellLeft - cellWidth;
						cellHeight = 25;
						if(cellWidth < 10 ) { cellWidth = 10; }
						exCellLeft = (exCellLeft >= $(this).width()) ? $(this).width() - 0.5: exCellLeft;
						expectedBarWidthValues[colNum][rowNum] = exCellLeft;

						//The display bars are shwon as DIVs. Main div shows the cell background (grey),
						//a div to show the actual value of the cell (pink/purple), a div to show the text of the cell,
						//a div to show the expected value (as a black bar).
                        
                      
                        expectationBarHTML = "<div class = ' " + d.cl + "Svg expectationOverlayBar overlayBar'"
							+ " id = 'expectedBarId' style = '"
							+ "max-width : " + expectationBarWidth + "px; width : " + expectationBarWidth + "px; height: " + cellHeight + "px; background-color : "
							+ (showExpectedValueOverlay ? COLORS.SLATE : COLORS.TRANSPARENT) + "; left : " + exCellLeft + "px; z-index: 80;'"
							+ ">";
                     
                        
						cellBarHTML = "<div class = 'cellOverlayBar overlayBar' style = 'max-width: " + $(this).width() + "px; width : " + $(this).width()
								+ "px; height: " + cellHeight + "px; background-color : " + COLORS.WHITE + ";' >"

								+ "<div class = 'actualOverlayBar overlayBar' style = 'max-width: " + cellWidth + "px; width : " + cellWidth
								+ "px; height: " + cellHeight + "px; background-color : " + (i % 2 == 0 ? COLORS.ODD_COLUMN : COLORS.EVEN_COLUMN) + "; z-index: 70;' >"
								//+ "<div class = 'textOverlayBar overlayBar' style='z-index: 90;'>" + colNum + "," + rowNum 
								//+ "</div>"// + "</div>"
								+ expectationBarHTML// + "</div>" 
								+ "<div class = 'textOverlayBar overlayBar' style='z-index: 50; left: -" + exCellLeft + "px'>" + d.html + "</div></div></div>"
								+ "</div>";
						colNum++;
						colNum %= (numericalAttributes.length - 1);

						if(colNum == 0) {
							rowNum++;
							rowNum %= data.length;
						}

						return cellBarHTML;
					}).attr("class", ƒ("cl"));
				}
			$("#tablePanel ." + tooltipAttribute).css({"white-space" : "nowrap"});		

			$("td.interactionWeight").addClass("tableSeperator");
			$("th.interactionWeight").addClass("tableSeperator");
        	
        	$("td").each(function(i, d) {
				$(this).css("min-width", minWidthTDTH);
			});
           
			
	}

	/*
	 * Private
	 * Display the table
	 */
    
	function displayPage(displayData) {
		if (displayData != undefined && displayData.length != 0) {

			displayMinimap();
            displayConsole();
            displayLegend();

            displayTable();
 
			addFunctionality(); 
			$("#discard_button").attr("disabled", "disabled");
			
			htmlTableToCache = $("#tablePanel tbody").html(); 
			
			console.log("podium.js: table appended");
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

		tableColumnWidthValues = {};
		$("th", "#tableId").each(function(d) {
 			tableColumnWidthValues[$(this).text()] = this.getBoundingClientRect().width;
 		});
		
		// update the cells
		rowNum = 0;
		colNum = 0;
		expectationBarWidth = 1;
		offset = columns.length - numericalAttributes.length + userAdjustedAttributesKeys.length;
		expectedBarValues = getExpectedValuesArray(rowRankingScores);
		if(expectedBarWidthValues.length == 0)
			expectedBarWidthValues = expectedBarValues.slice();

		//console.log(expectedBarWidthValues);

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
					cell["WidthNorm"] = row[c["head"] + "WidthNorm"];
					return cell; 
				});
			}).style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; })
			.each(function(parentD) {
				cellRef = $(this);
				if(!showBarOverlay || numericalAttributes.indexOf(parentD.head) < 1) {
					d3.select(this).html(ƒ("html"));
				}

				else if(d3.select(this).select("div")[0][0] == null) {

					d3.select(this).html(function(d, i) {
						expectationValue = (expectedBarValues[colNum - offset][rowNum]);
						cellWidth = ($(this).width() <= 0) ? 50 : $(this).width() * d.WidthNorm;
						//exCellLeft = ($(this).width() < 0) ? 50 : $(this).width() * expectationValue;
						exCellLeft = $(this).width() * expectationValue;
						//exCellLeft = exCellLeft - cellWidth;
						cellHeight = 25;
						if(cellWidth < 10 ) { cellWidth = 10 }
						exCellLeft = (exCellLeft >= $(this).width()) ? $(this).width() - 0.5: exCellLeft;
						expectedBarWidthValues[colNum - offset][rowNum] = exCellLeft;
						expectationBarHTML = "<div class = ' " + d.cl + "Svg expectationOverlayBar overlayBar'"
							+ " id = 'expectedBarId' style = '"
							+ "max-width : " + expectationBarWidth + "px; width : " + expectationBarWidth + "px; height: " + cellHeight + "px; background-color : "
							+ (showExpectedValueOverlay ? COLORS.SLATE : COLORS.TRANSPARENT) + "; left : " + exCellLeft + "px; z-index: 80;'"
							+ ">";
                        
						cellBarHTML = "<div class = 'cellOverlayBar overlayBar' style = 'max-width: " + $(this).width() + "px; width : " + $(this).width()
								+ "px; height: " + cellHeight + "px; background-color : " + COLORS.WHITE + ";' >"

								+ "<div class = 'actualOverlayBar overlayBar' style = 'max-width: " + cellWidth + "px; width : " + cellWidth
								+ "px; height: " + cellHeight + "px; background-color : " + (colNum % 2 == 0 ? COLORS.ODD_COLUMN : COLORS.EVEN_COLUMN) + "; z-index: 70;' >"
								//+ "<div class = 'textOverlayBar overlayBar' style='z-index: 90;'>" + colNum + "," + rowNum 
								//+ "</div>"// + "</div>"
								+ expectationBarHTML// + "</div>" 
								+ "<div class = 'textOverlayBar overlayBar' style='z-index: 50; left: -" + exCellLeft + "px'>" + d.html + "</div></div></div>"
								+ "</div>";	
						return cellBarHTML;
					});
				} else {

					d3.select(this).select(".actualOverlayBar")
								   .style("width", function(d, i) {
								   		cellWidth = tableColumnWidthValues[d.head] * d.WidthNorm;
								   		if(cellWidth < 10 ) { cellWidth = 10; }
								   		return cellWidth + "px";
								   })
								   .style("max-width", function(d, i) {
								   		return cellWidth + "px";
								   });

					d3.select(this).select(".textOverlayBar")
								  .html(function(d, i) { 
								  	return d.html;
								  });
				}

				colNum++;
				colNum %= (columns.length);
				if(colNum == 0) {
					rowNum++;
					rowNum %= data.length;
				}
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
            var widValue;
            if( widths[i] < minWidthTDTH ){
                widValue = minWidthTDTH;
            }else{
                widValue =  widths[i];
            }
			$(this).css("min-width", widValue);
			
		});	
       
        
        /*$("td").each(function(i, d) {
			$(this).css("min-width", minWidthTDTH);
			
		});	
        */
      
        
       
	}


	/*
	 * Update the mini map 
	 */
	mar.updateMinimap = function() {

		minimap = d3.select("#auxPanel #miniChart");
		minimap_rows = minimap.select("tbody")
			.selectAll("tr")
			.data(data);

		miniCharWidthValues = [];
		minimap_rows.selectAll("td")
			.data(function(row, i) {
				var newIndex = Number(row["rank"]);
				var oldIndex = Number(row["oldIndex"]);
				var opacity = opacityScale(Math.abs(Number(newIndex) - Number(oldIndex)));
				if (row["rank"] == row["oldIndex"])
					opacity = 1;
				
				var barColor = COLORS.MINIMAP_ROW;
				miniCharWidthValues.push((minimap_width * row["rankScore"])/maxRankScore);
				if (row["rank"] < row["oldIndex"])
					barColor = COLORS.NEGATIVE_MOVE_GRADIENT(opacity);
				else if (row["rank"] > row["oldIndex"])
					barColor = COLORS.POSITIVE_MOVE_GRADIENT(opacity);
            		return [
				        { column: "svg", value: '<svg class = miniMapSvg id = svg' + i  + ' width=' + minimap_width + 
				        '><rect id = rec'+ i + ' class = miniMapRect width=' + minimap_width * row["rankScore"] / maxRankScore
				        	+ ' height="50" fill="' + barColor + '"/></svg>' }];
	
			})
			.style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; })
			.html(function(d) {return d.value; })
			.attr("height",  "10px");

		miniCharWidthValues.sort(function(a, b) { return parseFloat(b) - parseFloat(a); });
		$("td", "#miniChart").attr("height", "1");
		$("svg", "#miniChart").height(mapBarHeight);
	}

	mar.updateExpectations = function(attributeName) {
		expectedBarValues = getExpectedValuesArray(rowRankingScores);
		if(expectedBarWidthValues.length == 0)
			expectedBarWidthValues = expectedBarValues.slice();

		$("." + getNonSpacedString(attributeName) + " .expectationOverlayBar").css({"left" : function(idx, val) {
			expectationValue = (expectedBarValues[numericalAttributes.indexOf(attributeName) - userAdjustedAttributesValues.length][idx]);
			tdwidth = $(this).parent().parent().width();
			exCellLeft = tdwidth * expectationValue;
			exCellLeft = (exCellLeft >= tdwidth) ? tdwidth - 5: exCellLeft;
			expectedBarWidthValues[numericalAttributes.indexOf(attributeName) - userAdjustedAttributesValues.length][idx] = exCellLeft;
			$(this).find(".textOverlayBar").css({"left" : "-" + exCellLeft + "px"});
			return exCellLeft;
		}});
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

			if (unusedAttributes.indexOf(d.id) >= 0) {
				d.amount = 0;
			}
			else if (weights == null) {
				d.amount = d.amount/totalPercentage;
			}
			else {
				d.amount = weights[d.id - offset];
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

			$("#consoleChart tr." + classNameConsoleAttr + " p").each(function() {

				if( a.indexOf($(this).text()) != -1)
					aTd = $(this).closest('td');

				if( b.indexOf($(this).text()) != -1)
					bTd = $(this).closest('td');
			});

			var indexAWidth = parseFloat(aTd.find('rect').attr('width'));
			var indexBWidth = parseFloat(bTd.find('rect').attr('width'));
			var indexAtext = aTd.closest('tr').text();
			var indexBtext = bTd.closest('tr').text();

			///*
			if (indexAWidth > indexBWidth)
				return -1;
			else if (indexBWidth > indexAWidth)
				return 1;
			else
				return 0;

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
	function getRowsForSolver(clickedRows, watchedRows, numRows) {
		// use the rank values of the rows with the given unique ids
		clickedRows = getRankValues(clickedRows); 
		watchedRows = getRankValues(watchedRows);
		
		if (numRows > data.length) {
			console.log("podium.js: cannot get more than " + data.length + " rows");
			return [];
		}
		
		var rowsForSolver = clickedRows.slice();
	
		for (var i = 0; i < watchedRows.length; i++) {
			if (rowsForSolver.indexOf(Number(watchedRows[i])) < 0)
				rowsForSolver.push(Number(watchedRows[i]));
		}
		
		var numSurrounding = Math.ceil((numRows - rowsForSolver.length) / clickedRows.length); 
		if (rowsForSolver.length >= numRows)
			return rowsForSolver; 
		
		for (var i = 0; i < clickedRows.length; i++) {
			var r = Number(clickedRows[i]);
			var count = 0; 
			var currentDist = 1; 
			
			// crawl out to find numSurrounding new rows
			while (count < numSurrounding) {
				// check r - currentDist
				if (r - currentDist > 0 && rowsForSolver.indexOf(r - currentDist) < 0) {
					rowsForSolver.push(r - currentDist);
					count++;
				}
				
				if (count == numSurrounding)
					break; 
				
				// check r + currentDist
				if (r + currentDist <= data.length && rowsForSolver.indexOf(r + currentDist) < 0) {
					rowsForSolver.push(r + currentDist);
					count++;
				}
				
				currentDist++; 
				if (currentDist > data.length)
					break;
			}
		}
		
		// return the row numbers
		return rowsForSolver;
	}
	
	
	/*
	 * Private
	 * Get a list of n rows taken from the surrounding area of the clicked rows
	 * Input is an array of unique ids
	 */
	function getSurroundingRowsForSolver(uniqueId) {
		// use the rank value of the row with the given unique id
		var rankVal = getDataByUniqueId(uniqueId)["rank"];
		
		var rowsForSolver = [];
		rowsForSolver.push(rankVal);
		
		if (rankVal < data.length)
			rowsForSolver.push(rankVal + 1);
		if (rankVal > 0)
			rowsForSolver.push(rankVal - 1);
		
		// return the row numbers
		return rowsForSolver;
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
	 * Normalize the data so higher attribute values have bigger normalized values
	 * Used to determine bar widths
	 */
	function setWidthNormValues(dataset, attr) {
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
			
			for (var i = 0; i < len; i++)
				dataset[i][attr + "WidthNorm"] = (parseFloat(dataset[i][attr]) - min) / (max - min);
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
				dataset[i][attr + "WidthNorm"] = (categoricalAttributeMap[attr][dataset[i][attr]] - min) / (max - min);
			}
		}
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
			
			if (attributeState == attributeStates.HIGH || attributeState == attributeStates.UNUSED) {
				for (var i = 0; i < len; i++)
					dataset[i][attr + "Norm"] = (parseFloat(dataset[i][attr]) - min) / (max - min);
			} else if (attributeState == attributeStates.LOW) {
				for (var i = 0; i < len; i++)
					dataset[i][attr + "Norm"] = 1.0 - (parseFloat(dataset[i][attr]) - min) / (max - min);
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
		
		// save all of the dot products in an array
		var dotProds = []; 
		for (var i = 0; i < matrix.length; i++) {
			var id = uniqueIds[i];
			var obj = getDataByUniqueId(Number(id));
			var attrVals = matrix[i];
			var dotProd = Number(numeric.dot(attrVals, weights));
			dotProds.push(Number(dotProd));
		}
		
		var maxRankScoreWOutInteraction = Math.max.apply(null, dotProds);
		// apply interaction weight to the computed scores
		for (var i = 0; i < matrix.length; i++) {
			var id = uniqueIds[i];
			var obj = getDataByUniqueId(Number(id));
			var dotProd = dotProds[i];
			var interactionWeight = Number(obj.ial.weightNorm);
			var interactionVal = Number(obj.rankNorm) * maxRankScoreWOutInteraction;
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
	 * Runs solver using regression for the changed rows and returns an array of normalized weights
	 * If no rows have been changed, returns the current array of attribute weights
	 */
	function runRegressionSolver() {
		console.log("podium.js: regression solver");
		var selectedRowIds = []; 
		
		for (var i = 0; i < selectedRows.length; i++)
			selectedRowIds.push(getDataByFirstCategoricalAttr(selectedRows[i])["uniqueId"]);
		
		var b = getChangedRows(); 
		
		// don't recompute unless something has been moved
		if (getChangedRows().length < 1) { 
			// make sure the weights are updated
			updateColumnWeights(null);
			retArray = attributeWeights.slice();

			//getting rid of the interaction weight
			retArray.splice(0, 1);

			var normalizedWeights = normalize(retArray);
			return normalizedWeights;
		} 
		
		// combine the lists
		for (var i = 0; i < selectedRowIds.length; i++) {
			if (b.indexOf(selectedRowIds[i]) < 0)
				b.push(selectedRowIds[i]);
		}
		
		if (b.length == 1) {
			// when only one item is being modeled, add surrounding rows
			b = getUniqueIds(getSurroundingRowsForSolver(b[0]));
		}
		
		var regressionAttributes = [];
		var slopeDiff = [];
		for (var i = userAdjustedAttributesKeys.length; i < numericalAttributes.length; i++) {
			var currentAttribute = numericalAttributes[i];
			var xRegressionData = []; // normalized rank values
			var yRegressionData = []; // normalized attribute values
			var slope; 
			if (attributeStatesMap[currentAttribute] == attributeStates.UNUSED)
				slope = 0; 
			else {
				for (var j = 0; j < b.length; j++) {
					var currentDataItem = getDataByUniqueId(b[j]);
					xRegressionData.push(Number(1.0 - (currentDataItem["rank"]) / data.length));
					yRegressionData.push(currentDataItem[currentAttribute + "Norm"]);
				}
				slope = getRegressionSlope(xRegressionData, yRegressionData);
			}
			
			regressionAttributes.push(currentAttribute);
			slopeDiff.push(slope); // ideal slope is +1
		}
		
		// negative slopes should be given weight 0 
		// everything else should be normalized in [0, 1]
		for (var i = 0; i < slopeDiff.length; i++) {
			if (slopeDiff[i] < 0)
				slopeDiff[i] = 0;
			else if (slopeDiff[i] > 1) // make it the recriprocal value so we can compare with slopes < 45 deg.
				slopeDiff[i] = 1.0 / slopeDiff[i];
		}
		
		// normalize the slope differences to be the normalized attribute weights
		var weightSum = 0; 
		for (var i = 0; i < slopeDiff.length; i++)
			weightSum += slopeDiff[i]; 
		
		for (var i = 0; i < slopeDiff.length; i++)
			slopeDiff[i] = slopeDiff[i] / weightSum;

		return slopeDiff;
	}
	
	
	/*
	 * Get the slope of the regression line through the given points
	 * Takes in two arrays: one of x values and one of corresponding y values
	 */
	function getRegressionSlope(xVals, yVals) {
		var xSum = 0; 
		var ySum = 0; 
		var xySum = 0; 
		var xxSum = 0; 
		var yySum = 0; 
		var numVals = xVals.length;
		
		for (var i = 0; i < xVals.length; i++) {
			var currentX = xVals[i]; 
			var currentY = yVals[i];
			xSum += currentX;
			ySum += currentY;
			xySum += currentX * currentY;
			xxSum += currentX * currentX; 
			yySum += currentY * currentY;
		}
		
		var slope = ((numVals * xySum) - (xSum * ySum)) / ((numVals * xxSum) - (xSum * xSum));
		
		return slope; 
	}
	
	
	/*
	 * Get the expected values of all attributes for all given rows with rank scores.
	 */
	function getExpectedValuesArray(rankPositions) {
		var expectedValuesArray = [];
		var pos;
		var maxRankScore = Number.MIN_VALUE; 
		
		// figure out the maximum rank score
		for (var i = 0; i < data.length; i++) {
			var currentRankScore = Number(data[i]["rankScore"]);
			if (currentRankScore > maxRankScore) {
				maxRankScore = currentRankScore;
			}
		}

		getExpectedValue = function(i) {
			var expectedVal = maxRankScore * (1.0 - (rankPositions[i] / data.length));
				if (rankPositions[i] == 1)
					expectedVal = maxRankScore * 1;
				if (rankPositions[i] == data.length)
					expectedVal = 0; 
				return expectedVal;
		}

		for (var attr = userAdjustedAttributesKeys.length; attr < numericalAttributes.length; attr++) {
			var colExpectatedVals = [];
			if(attributeStatesMap[numericalAttributes[attr]] == attributeStates.LOW) {
				for(var i = rankPositions.length - 1; i >= 0; i--) {
					colExpectatedVals.push(getExpectedValue(i));
				}
			} else {
				for (var i = 0; i < rankPositions.length; i++) {
					colExpectatedVals.push(getExpectedValue(i));
				}
			}
			expectedValuesArray.push(colExpectatedVals);
		}
		return expectedValuesArray;
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
	 * Update width of mini row object
	 */
	function updateMiniRowWidth(newMiniRowObj, oldIndex) {
		newMiniRowObj.attr("width", miniCharWidthValues[oldIndex]);
	}

	/*
	 * Private
	 * Update Expected bar positions for rows
	 */
	 function updateRowExpectations(oldIndex, newIndex) {
	 		
	 	if(oldIndex == newIndex) return;

	 	var tableRow =  $("#tablePanel tr").filter(function() { 
	 			return $(this).find("td.oldIndex").html() == oldIndex; 
	 	});

	 	exIndex = newIndex - 1;
	 	colNum = 0;
	 	tableRow.find(".expectationOverlayBar").css("left", function(d) {
	 		$(this).find(".textOverlayBar").css({"left" : "-" + expectedBarWidthValues[colNum][exIndex] + "px" });
	 		return expectedBarWidthValues[colNum][exIndex];
	 		colNum++;
	 	});
	 }

	
	/*
	 * Private
	 * Update the opacity of the given row object based on the change in index
	 */
	function updateColorAndOpacity(rowObj, newMiniRowObj, oldIndex, newIndex) {
		var opacity = opacityScale(Math.abs(Number(newIndex) - Number(oldIndex)));
		if (newIndex == oldIndex)
			opacity = 0;

		color = '';
		miniColor = '';

		if (colorOverlay) {
				if(rowObj.hasClass('greenColorChange')) {
					rowObj.css("background-color", COLORS.POSITIVE_MOVE_GRADIENT(opacity));
					newMiniRowObj.css("fill", COLORS.POSITIVE_MOVE_GRADIENT(opacity));
				}
				else if(rowObj.hasClass('redColorChange')) {
					rowObj.css("background-color", COLORS.NEGATIVE_MOVE_GRADIENT(opacity));
					newMiniRowObj.css("fill", COLORS.NEGATIVE_MOVE_GRADIENT(opacity));
				} else {
					newMiniRowObj.css("fill", COLORS.LIGHT_GREY);
					newMiniRowObj.css("opacity", 1);
				}
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
	function toggleActiveTab(tabToActivate) {
		for(var tab in TABS) {
			if(TABS[tab] == tabToActivate || TABS[tab] == currentActiveTab) {
				$("#auxPanel #" + TABS[tab]).toggleClass("active");
			}
		}

		currentActiveTab = tabToActivate;
	}
	
	/*
	 * Private
	 * Return a non-spaced version of a string, so it can be 
	 * indexed by jquery
	 */
	 function getNonSpacedString(strname) {
	 	return strname.split(" ").join("_").replace("(", "").replace(")", "");
	 }

	/**************************************INPUTS**************************************/
	
	/*
	 * Return the table to its state before changes were made
	 */
	mar.discardButtonClicked = function() {
		console.log("podium.js: discarding changes"); 
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
            $('#tablePanel tbody .School').animate({ backgroundColor: COLORS.WHITE }, 1000);
        }, timeDie);
        $("#discard_button").attr("disabled","disabled");
	}
	
	
	/*
	 * Rank!
	 */
	mar.rankButtonClicked = function() {
		
        rankButtonPressed = true;
       
        greyMinibars(false);
		console.log("podium.js: ranking"); 
		var normalizedWeights = runRegressionSolver();
		
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
		colorAndResizeRows(false);
     
        //miniRowValues = miniCharWidthValues.slice();
		//miniCharWidthValues = [];
		// update oldIndex to match rank after it has been used to color rows
		for (var i = 0; i < ranking.length; i++) {
			var id = Number(ranking[i]["id"]);
			var obj = getDataByUniqueId(id);
			//miniCharWidthValues.push(miniRowValues[obj["rank"]]);	
			var rank = obj["rank"];
			obj["oldIndex"] = rank; 
			var rowObj = $('tr', '#tablePanel').eq(i + 1);
			rowObj.find("td.oldIndex").html(rank);
		}
     	
     	//console.log(miniCharWidthValues);  
		changedRows = []; // reset changed rows
		updateColumnWeights(normalizedWeights.slice());
        sortConsoleChartBars();
     
        getRankScores();
        getInteractionWeights();
        var normInterArray = normalizeArray(interactionValueArray)
        enableBarsOnCols("td.interactionWeight.tableSeperator", normInterArray, interactionValueArray, 0);   
        var normRankArray = normalizeArray(rankScoreValueArray);
        enableBarsOnCols("td.rankScore", normRankArray, rankScoreValueArray, 1);
        updateRowFont();
        selectionUpdatedMiniBar();
        padMiniBars();
     
        rankButtonPressed = false;
        setTimeout(function() {       
            $('#tablePanel tbody .School').animate({ backgroundColor: COLORS.WHITE }, 1000);
        }, timeDie);
       
        htmlTableToCache = $("#tablePanel tbody").html(); 
        htmlConsoleToCache = [];
		d3.selectAll("#consoleChart td").each(function(d) {
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
        console.log("podium.js: ranking done");
	}
    
    
	/*
	 * Toggle the color overlay
	 */
	mar.colorOverlayToggle = function() {
		colorOverlay = !colorOverlay;

		if (!colorOverlay)
			$("tr").css("background", COLORS.WHITE);
		else
			colorAndResizeRows(false);
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
		colorAndResizeRows(false);
	}

	mar.barOverlayClicked = function() {
		showBarOverlay = !showBarOverlay;
		mar.updateTable();
		getRankScores();
        getInteractionWeights();
        var normInterArray = normalizeArray(interactionValueArray)
        enableBarsOnCols("td.interactionWeight.tableSeperator", normInterArray, interactionValueArray, 0);   
        var normRankArray = normalizeArray(rankScoreValueArray);
        enableBarsOnCols("td.rankScore", normRankArray, rankScoreValueArray, 1);
        
        if(showExpectedValueOverlay && showBarOverlay ){
            $("td #expectedBarId").css({"background-color" : COLORS.SLATE})
        }else{
            $("td #expectedBarId").css({"background-color" : COLORS.TRANSPARENT})
        }
        
	}
    
    
    mar.expectedValueOverLayClicked = function() {
		showExpectedValueOverlay = !showExpectedValueOverlay;
        if(showExpectedValueOverlay && showBarOverlay ){
            $("td #expectedBarId").css({"background-color" : COLORS.SLATE})
        }else{
            $("td #expectedBarId").css({"background-color" : COLORS.TRANSPARENT})
        }
	}

	/*
	 * Toggle to the console tab
	 */
	mar.changeToConsole = function() {
		toggleActiveTab(TABS.CONSOLE);
		
		$("#legendChart").css({"display" : "none"});
		$("#miniChart").css({"display":"none"});
		$("#consoleChart").css({"display":"block"});
	}

	/*
	 * Toggle to the mini map tab
	 */
	mar.changeToMinimap = function() {
		toggleActiveTab(TABS.MINIMAP);

		$("#legendChart").css({"display" : "none"});
		$("#consoleChart").css({"display":"none"});
		$("#miniChart").css({"display":"block"});
	}
	

	mar.changeToLegend = function() {
		toggleActiveTab(TABS.LEGEND);
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
        tooltipMiniChart();
        addFixedHeader();
        enableConsoleChartTooltips();
        drawBars();
        getDefFontSizeWeight();

	}
    
	
	/*
     * Private
     * Gets the defaunt font size and weight of Main table when page loads first time
     */
	function getDefFontSizeWeight(){
    	defFontSize = $("#tr1").css('font-size');
    	defFontWeight = $("#tr1").css('font-weight');
	}
    
    
    /*
     * Private
     * Draw the bars in the main table
     */
    function drawBars() {
          if (count == 0) {
            
            // handle bars for interaction weights
            tag = 1;
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
    	});  
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
    		colorValue = COLORS.EVEN_COLUMN;
    	} else {
    		// rank score
    		colorValue = COLORS.ODD_COLUMN;
    	}
    	
    	var item = 0;
    	var prevWidth = 0;
    	$(selector).each(function() {
			var tdWidth = $(this).width() * normalizedArray[item];
			if (isNaN(tdWidth)) 
				tdWidth = prevWidth;

			var current = $(this).text();
			var content = "<p class = 'textToHide'>"+current +"</p><svg class = ' " + selector + "'Svg' id = ''  width = " + tdWidth+"><rect id = 'something' class = 'some' width=" + tdWidth+" height= 50 fill='" + colorValue + "'/></svg>"; 
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
		$("#tableId .header").css({"color":COLORS.SLATE});
		d3.select("#tableId").append("div").attr("class", "pseudoDivWrapper");		
		$("#tableId thead").clone().attr("class", "pseudoHeader").removeClass("header").appendTo(".pseudoDivWrapper");

		widths = [];
		tableColumnWidthValues = {};
		$("th", "#tableId").each(function(d) {
			widths.push(this.getBoundingClientRect().width);
			tableColumnWidthValues[$(this).text()] = this.getBoundingClientRect().width;
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
		updateClickedItem();
        selectionUpdatedMiniBar();
        var selectorVariable = "tr .rank.index.null";
        //removes rows when clicked on rank index cell
		$(selectorVariable).click(function(event) {
               
                var item = $(this).closest('tr').index();
				isDragging = false;
				var teamName = "";
				var tx = 0;
				
				$('.' + tooltipAttribute).each(function() {
					tx += 1;
					if (item == tx - 2){
                        teamName = $(this).text(); 
                                           
                    }           
						
				});

				var index = selectedRows.indexOf(teamName);
				if (index != -1) {
					selectedRows.splice(index, 1);
				}
        updateRowFont();              
        miniMapDotRemove(item);       
        
	})
    }

    /*
	 * Private
	 * Removes the Dot on the minimap with a specific id number
	 */
    function miniMapDotRemove(item){
         var dotSelector = "#miniChart #tr"+item+" #Dot";
         $(dotSelector).remove();
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
            placeDotsOnMiniBar(item);
            
            updateRowFont();
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
					if (item == tx - 2){
                        teamName = $(this).text(); 
                    }
				});

                editSelectedRowItems(teamName);
				selectedRows.push(teamName);
				selectedRows = selectedRows.filter(function(item, ps) {
					return selectedRows.indexOf(item) == ps;
				});
			}
		}
        
	}    
    
    /*
	 * Private
	 * Places the Dot on MiniBar
	 */
    function placeDotsOnMiniBar(id){
         //$("#rec" + id).css("fill", COLORS.GREY);
        var elemTr = $("#rec" + id).closest('tr');
        var elemTrId = elemTr.attr('id');

        var addCircle = "<rect id='Dot' class='miniDotSvg' width='5' height='10' fill=" + COLORS.SLATE + "></rect>";
        //var addCircle ="<circle id='Dot' class='miniDot' cx = "+recLeft+ " cy= " + recTop + " r = '10' stroke=" + COLORS.SLATE + " stroke-width='1' fill= " + COLORS.RED + "/>>";
        var elemTd = $("#rec" + id).closest('svg');
        var elemTdHtml = "" + elemTd.html() + addCircle;
        elemTd.html(elemTdHtml);
    }
    
    /*
	 * Private
	 * Updates the rows of mini bar as grey color, when main table rows are selected
	 */
	function selectionUpdatedMiniBar(){
		miniChartCache = $("tr .rank.index.null").html();
        
        $('#Dot').remove();
		var iter = 0;
		$("tr .rank.index.null").each(function() {
			var backColor = $(this).css("background-color");
            var backColor2 = $(this).css("background");
			backColor2 = backColor2.substring(0, 15);
			if (backColor == COLORS.RANKCELL_BACKCOLOR || backColor == COLORS.TRANSPARENT) {

			} else {
				var id = iter - 1;
                placeDotsOnMiniBar(id);
               
			}
     
            

			if (backColor2 === COLORS.MINIMAP_ROW_SELECTED)
				var id2 = iter - 1;
			iter += 1;
		});

        
		$("#miniChart tr").css("color", COLORS.SLATE);
		$("#miniChart svg").css("height", mapBarHeight);
		$("#miniChart rect").css("height", mapBarHeight);
	}
    
    /*
	 * Private
	 * Adds padding between rows of minibar
	 */
    function padMiniBars(){
        var paddedHeightMiniBars = mapBarHeight + paddingMiniBars;
        $("#miniChart tr").css("height", paddedHeightMiniBars);        
    }
    
    /*
	 * Private
	 * Updates the selected row array based on if you have clicked on a watched row again or not
	 */
    function editSelectedRowItems(teamName){
        var index  = -1;
        for(var i=0;i<selectedRows.length;i++){
            if(teamName == selectedRows[i]){
                index = i;
            }
        }
        
        if(index>-1){
            selectedRows.splice(index, 1);
            selectedRows.push(teamName);
        }
    }
	
	/*
	 * Private
	 * Update the font of the given row
	 */
	function updateRowFont() {
        var greyColor = COLORS.GREY;
        var darkGreyColor = COLORS.DARK_GREY;
		$("tr").css("font-size", defFontSize);
		$("tr").css("font-weight", defFontWeight);       
                
        var iter =0;
        $("tbody tr .rank.index.null").each(function() {
            if(iter>-1){
               $(this).css("background", COLORS.WHITE);
               $(this).css("color", COLORS.SLATE);
          
            }  
            
            iter += 1;
            });
        
		for (var i = 0; i < selectedRows.length; i++) {
            //console.log("selected rows items : " + selectedRows[i] + "    this text : " +  $(this).text());
			$('.' + tooltipAttribute).each(function() {
				if (selectedRows[i] == $(this).text()) {
					var idValTr = $(this).closest('tr');                
                    var rankCol = $(this).closest('tr').find('.rank.index.null');
                    var idThis = $(this).closest('tr').attr('id');

                    //ELSE CURRENT ROW IS NOT GREY                    
                    if (i == selectedRows.length - 1) {
						//idValTr.css("color", COLORS.SLATE);
						//idValTr.css("font-weight", "900");                        
                        var styleContent = "color: " + COLORS.WHITE + "; background: " + COLORS.SLATE + ";" // FONT_COLOR_DARK
                        rankCol.attr("style", styleContent);
					} else {
                        idValTr.css("font-weight", defFontWeight); 
                        var styleContent = "color: " + COLORS.SLATE + "; background: " + COLORS.LIGHT_GREY + ";"
                        rankCol.attr("style", styleContent);
                       
					}
				}else{
                }
			});
		} 
        
      
	}
    
    
	/*
	 * Private
	 * Adds tooltip to the minimap
	 */	
    function tooltipMiniChart(){
        var selectorVar = ".miniTr";
		$(selectorVar).find("td").hover(function() {
        //$(selectorVar).hover(function() {
            var svgItem = $(this).find("svg");
            var clickedRow = parseInt((svgItem.attr("id")).substr(3,4));
            //var clickedRow = $(this).index();
            //console.log("well this index is :" +clickedRow);
            var mainTableSelector = "#tableId #tr"+clickedRow;
            var mainTrHtml = $(mainTableSelector).html();
            
            var rankScoreText = $(mainTableSelector).find('.rankScore').text();
            
            var teamName = $(mainTableSelector).find('.School').text();
            
			var toolText = "(" + (clickedRow + 1) + ") "+ teamName + "; Rank Score: " + rankScoreText;
			$(this).attr("title", toolText); 

			$(this).tooltip({
				tooltipClass: "tooltipMiniChart",
			});

			$(this).tooltip({
				position: {
					my: "right top",
					at: "center top"
				}
			});
            
        })
    }
    
   
	/*
	 * Private
	 * Add the fisheye effect to the mini-map
	 */
	function tablelens() {

		var defTrHeight = $(".miniTr")[0].offsetHeight;
		var defSvgHeight = $(".miniMapSvg")[0].offsetHeight;
		var defFontSize = $("#tr1").css('font-size');

        var selectorVar = ".miniTr";
        //var selectorVar = "#miniChart td";
		$(selectorVar).hover(function() {
            
			var clickedRow = $(this).index();
			
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
				$(".miniTr").css('background', COLORS.LIGHT_GREY);
				$(".miniTr").css('color', COLORS.SLATE);
				$(".miniMapSvg").css('height',defSvgHeight);
			}
		}, function() {
			$("#miniChart tr").css("color", COLORS.SLATE);
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

			colorAndResizeRows(true);
            getInteractionWeights();
            var normInterArray = normalizeArray(interactionValueArray)
            enableBarsOnCols("td.interactionWeight.tableSeperator", normInterArray, interactionValueArray,0);
            tooltipMiniChart();
            /*
            setTimeout(function() {       
            
            }, timeDie);
            */
		};

		$("#tablePanel tbody").sortable({
		    helper: fixHelperModified,
		    stop: updateIndex
		}).disableSelection();
        
	}
	
	/*
	 * Private
	 * Make the rows of the minimap the default color
	 */
	mar.makeMiniRowsDefaultColor = function() {
		minimap = d3.select("#auxPanel #miniChart");
		minimap_rows = minimap.select("tbody")
			.selectAll("tr")
			.data(data);

		minimap_rows.selectAll("td")
			.data(function(row, i) {
				var newIndex = Number(row["rank"]);
				var oldIndex = Number(row["oldIndex"]);
				var opacity = opacityScale(Math.abs(Number(newIndex) - Number(oldIndex)));
				if (row["rank"] == row["oldIndex"])
					opacity = 1;
				
				var barColor = COLORS.MINIMAP_ROW;
				miniCharWidthValues.push((minimap_width * row["rankScore"])/maxRankScore);
            		return [
				        { column: "svg", value: '<svg class = miniMapSvg id = svg' + i  + ' width=' + minimap_width + 
				        '><rect id = rec'+ i + ' class = miniMapRect width=' + minimap_width * row["rankScore"] / maxRankScore
				        	+ ' height="50" fill="' + barColor + '"/></svg>' }];
	
			})
			.style("display", function(d) { if (d.displayStyle != undefined) return d.displayStyle; else return ""; })
			.html(function(d) {return d.value; })
			.attr("height",  "10px");
		
		miniCharWidthValues.sort(function(a, b) { return parseFloat(b) - parseFloat(a); });
		$("td", "#miniChart").attr("height", "1");
		$("svg", "#miniChart").height(mapBarHeight);
	}
	

	/*
	 * Private
	 * Modify the colors of the rows based on where they have been moved.
	 * If toResize is True, then minimap row widths are also resized, otherwise not.
	 */
	function colorAndResizeRows(toResize) {
		var movedRow = $(lastChangedRow);
		$('tr', "#tablePanel tbody").each(function (i) {
            //var onlySchoolTd = $(this);  
            var onlySchoolTd = $(this).find(".School");          
			var newIndex = Number($(this).find("td.rank.index").html());
			var oldIndex = Number($(this).find("td.oldIndex").html());
			var uniqueId = $(this).find("td.uniqueId").html();

			var movedRowIndex = movedRow.find("td.rank.index").html();

			if ((showAllRows == false && changedRows.indexOf(Number(uniqueId)) == -1) ||
					(newIndex == oldIndex)) {
				onlySchoolTd.removeClass('greenColorChange');
				onlySchoolTd.removeClass('redColorChange');
				onlySchoolTd.animate({ backgroundColor: "transparent" }, 1000);
			} else if (newIndex > oldIndex) {
				onlySchoolTd.removeClass('greenColorChange');
				onlySchoolTd.addClass('redColorChange');
			} else if (newIndex < oldIndex) {
				onlySchoolTd.removeClass('redColorChange');
				onlySchoolTd.addClass('greenColorChange');
			}
			
			newMiniRow = $("#miniChart #tr" + (newIndex - 1) + " rect");
			updateColorAndOpacity(onlySchoolTd, newMiniRow, oldIndex, newIndex);

			if(toResize) {
				updateMiniRowWidth(newMiniRow, oldIndex);
				updateRowExpectations(oldIndex, newIndex);
			}
		});

        if (!rankButtonPressed){
            selectionUpdatedMiniBar();  
        }
	}

	/*
	 * Private
	 * grey out the bars on the mini map and disable drag interaction
	 */
	function greyMinibars(greyOut) {
		disallowWeightAdjustment = greyOut;
		$("#consoleChart rect").each(function(i, d) {
			if (i < userAdjustedAttributesKeys.length) 
				return;

			if (greyOut){                
				$(this).attr("fill", COLORS.GREY);
                 }
			else{
                $(this).attr("fill", COLORS.SLATE);
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

					attributeStatesMap[html_text] = attributeStates.HIGH;

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
					attributeStatesMap[clickedRowName] = attributeStates.HIGH;
				} else if ($(clickedObj).hasClass('directionDown')) {
					$(clickedObj).attr('src', 'img/arrow-down.png');
					// re-normalize the attribute
					normalizeAttribute(data, clickedRowName, attributeStates.LOW);
					attributeStatesMap[clickedRowName] = attributeStates.LOW;
				} else if ($(clickedObj).hasClass('unusedRow')) {
					$(clickedObj).attr('src', 'img/remove.png');
					$((($(this).parent())[0])).addClass("disabledAttribute");

					id = $(this).attr("id");
					unusedAttributes.push(parseInt(id.replace(/[^0-9\.]/g, ''), 10));
					normalizeAttribute(data, clickedRowName, attributeStates.UNUSED);
					attributeStatesMap[clickedRowName] = attributeStates.UNUSED;
				}
				
				mar.updateExpectations(clickedRowName);
				$("#discard_button").removeAttr("disabled");
			});
		}

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
					attributeStatesMap[clickedRowName] = attributeStates.HIGH;
				} else if ($(clickedObj).hasClass('directionDown')) {
					$(clickedObj).attr('src', 'img/arrow-down.png');
					// re-normalize the attribute
					normalizeAttribute(data, clickedRowName, attributeStates.LOW);
					attributeStatesMap[clickedRowName] = attributeStates.LOW;
				} else if ($(clickedObj).hasClass('unusedRow')) {
					$(clickedObj).attr('src', 'img/remove.png');
					$(((pObj.parent())[0])).addClass("disabledAttribute");

					id = pObj.attr("id");
					unusedAttributes.push(parseInt(id.replace(/[^0-9\.]/g, ''), 10));
					normalizeAttribute(data, clickedRowName, attributeStates.UNUSED);
					attributeStatesMap[clickedRowName] = attributeStates.UNUSED;
				}
				mar.updateExpectations(clickedRowName);
			});
		}
	}


})();