const attributeStates = {"HIGH" : 1, "LOW" : 2, "UNUSED" : 3};

/*Colors*/

getPositiveMoveWithOpacity = function(opacity) { 
	return 'rgba(44, 160, 44, ' + opacity + ')';
}

getNegativeMoveWithOpacity = function(opacity) {
	return 'rgba(214, 39, 40, ' + opacity + ')';
}

const COLORS = {
		"ODD_COLUMN" : "#c4d6ed",
		"EVEN_COLUMN" : "#ebf1f9",
		"POSITIVE_MOVE" : "#37c837",
		"NEGATIVE_MOVE" : "#df5353",
		"POSITIVE_MOVE_GRADIENT" : getPositiveMoveWithOpacity,
		"NEGATIVE_MOVE_GRADIENT" : getNegativeMoveWithOpacity,
		"MINIMAP_ROW" : "#e6e6e6",
		"MINIMAP_ROW_SELECTED" : "rgb(99, 99, 99)",
		"CONSOLE_ROW" : "#337ab7",
		"FONT_COLOR_DARK" : "rgb(99, 99, 99)",
		"FONT_COLOR_LIGHT" : "rgb(189, 189, 189)",
		"GREY" : "#bdbdbd",
		"DARK_GREY" : "#636363",
		"LIGHT_GREY" : "#e6e6e6",
		"LIGHTEST_GREY" : "#f2f2f2",
		"SLATE" : "#555",
	    "RANKCELL_BACKCOLOR" : "rgb(255, 255, 255)",
		"BLACK" : "rgb(0,0,0)",
		"TRANSPARENT" : "rgba(0, 0, 0, 0)",
		"WHITE" : "rgb(255, 255, 255)",
		"BLUE" : "#337ab7",
		"RED" : "#FF0000",
	};

const legendItems = [[COLORS.POSITIVE_MOVE, "Row moved up in ranking"],
					 [COLORS.NEGATIVE_MOVE, "Row moved down in ranking"],
					 [COLORS.MINIMAP_ROW, "Row didn't move in ranking"],
					 [COLORS.MINIMAP_ROW_SELECTED, "Watched row"]
					];

const TABS = {"MINIMAP" : "minimapTab", "CONSOLE" : "consoleTab" , "LEGEND" : "legendTab"};

