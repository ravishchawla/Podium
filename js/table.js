var data; 
var keys;
var lockIcon = "<img src ='img/lock.png' width='20' height='20' class='tableIcon lockIcon'>";
var pinIcon = "<img src ='img/pin.png' width='20' height='20' class='tableIcon pinIcon'>";

// load the table for the first time
function loadTable() {
	loadData("data/nflData.csv");
}

// load the data from the given file
function loadData(fileName) {
	d3.csv(fileName, function(dataset) {
		this.data = dataset;
		displayTable(this.data);
	});
}

// display the table
function displayTable(displayData) {
	if (displayData != undefined && displayData.length != 0) {
		this.keys = Object.keys(displayData[0]);
		var htmlTable = "<table id='tableId'>\n";
		
		// append the header
		htmlTable += "  <thead>\n";
		htmlTable += "    <tr>\n";
		htmlTable += "      <th data-header='rank'  class='dragtable-drag-boundary'><div class='dragtable-drag-handle'></div>Rank</th>\n";
		htmlTable += "      <th data-header='lock'><div class='dragtable-drag-handle'></div>Lock Position</th>\n";
		for (var i = 0; i < this.keys.length; i++)
			htmlTable += "      <th data-header='" + (i+1) + "'><div class='dragtable-drag-handle'></div>" + keys[i] + "</th>\n";
		htmlTable += "    </tr>\n";
		htmlTable += "  </thead>\n";
		
		// append the data
		htmlTable += "  <tbody>\n";
		for (var i = 0; i < displayData.length; i++) {
			htmlTable += "  <tr>\n";
			htmlTable += "    <td class='index'>" + (i+1) + "</td>\n";
			htmlTable += "    <td class='lockDiv'></td>\n";
			for (var j = 0; j < keys.length; j++) {
				htmlTable += "    <td>" + displayData[i][keys[j]] + "</td>\n";
			}
			htmlTable += "  </tr>\n";
		}
		htmlTable += "  </tbody>\n";
		htmlTable += "</table>\n";
		$("#tablePanel").append(htmlTable);
		
		addFunctionality(); 
		
		var testRelLockButton = "<button id='testRelLockButton' onclick='getRelativeLockRows()'>Test Relative Lock Row Getter</button>";
		$("#auxPanel").append(testRelLockButton);
		var testAbsLockButton = "<button id='testAbsLockButton' onclick='getAbsoluteLockRows()'>Test Absolute Lock Row Getter</button>";
		$("#auxPanel").append(testAbsLockButton);
		var testAllLockButton = "<button id='testAllLockButton' onclick='getAllLockRows()'>Test All Lock Row Getter</button>";
		$("#auxPanel").append(testAllLockButton);
		
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
	
	// add on click event to toggle lock position
	var table = document.getElementById("tableId");
	var lockCells = table.getElementsByClassName("lockDiv");
	for (var i = 0; i < lockCells.length; i++) {
		lockCells[i].onclick = function() {
			toggleLock(this);
		}
	}
}

// toggle the lock icon
function toggleLock(clickedDiv) {
	if (clickedDiv != undefined) {
		if (clickedDiv.innerHTML == "") {
			clickedDiv.innerHTML = pinIcon; 
		} else if (clickedDiv.innerHTML.indexOf("pinIcon") > -1) {
			clickedDiv.innerHTML = lockIcon; 
		} else if (clickedDiv.innerHTML.indexOf("lockIcon") > -1) {
			clickedDiv.innerHTML = "";
		} else {
			console.log("inner html: " + clickedDiv.innerHTML);
		}
	} else {
		console.log("table.js: undefined in toggleLock()");
	}
}

// get a list of rows with absolute locks
function getAbsoluteLockRows() {
	var absLockRows = []; 
	var table = document.getElementById("tableId");
	var tableBody = table.getElementsByTagName("tbody")[0];
	var tableRows = tableBody.getElementsByTagName("tr");
	var lockCellIndex = null; 
	for (var i = 0; i < tableRows.length; i++) { 
		var rowCells = tableRows[i].getElementsByTagName("td");
		if (lockCellIndex == null) {
			for (var j = 0; j < rowCells.length; j++) {
				if (rowCells[j].outerHTML.indexOf("lockDiv") > -1) 
					lockCellIndex = j; 
			}
		}
		if (lockCellIndex != null && rowCells[lockCellIndex].innerHTML.indexOf("lockIcon") > -1)
			absLockRows.push(+rowCells[0].innerHTML);
	}
	absLockRows.sort(function(a, b) { return a-b; });
	console.log("Absolute Locked Rows: " + absLockRows);
	return absLockRows;  
}

// get a list of rows with relative locks
function getRelativeLockRows() {
	var relLockRows = []; 
	var table = document.getElementById("tableId");
	var tableBody = table.getElementsByTagName("tbody")[0];
	var tableRows = tableBody.getElementsByTagName("tr");
	var lockCellIndex = null; 
	for (var i = 0; i < tableRows.length; i++) { 
		var rowCells = tableRows[i].getElementsByTagName("td");
		if (lockCellIndex == null) {
			for (var j = 0; j < rowCells.length; j++) {
				if (rowCells[j].outerHTML.indexOf("lockDiv") > -1) 
					lockCellIndex = j; 
			}
		}
		if (lockCellIndex != null && rowCells[lockCellIndex].innerHTML.indexOf("pinIcon") > -1)
			relLockRows.push(+rowCells[0].innerHTML);
	}
	relLockRows.sort(function(a, b) { return a-b; });
	console.log("Relative Locked Rows: " + relLockRows);
	return relLockRows; 
}

// get a list of all locked rows
function getAllLockRows() {
	var lockRows = []; 
	lockRows = lockRows.concat(getAbsoluteLockRows());
	lockRows = lockRows.concat(getRelativeLockRows());
	lockRows.sort(function(a, b) { return a-b; }); 
	console.log("All Locked Rows: " + lockRows);
	return lockRows; 
}