const attributeStates = {"HIGH" : 1, "LOW" : 2, "UNUSED" : 3};

/*Colors*/

getPositiveMoveWithOpacity = function(opacity) { 
	if (opacity > 0.9)
		return 'rgb(50, 205, 50)';
	else if (opacity > 0.8)
		return 'rgb(70, 210, 70)';
	else if (opacity > 0.7)
		return 'rgb(91, 215, 91)';
	else if (opacity > 0.6)
		return 'rgb(111, 220, 111)';
	else if (opacity > 0.5)
		return 'rgb(132, 225, 132)';
	else if (opacity > 0.4)
		return 'rgb(152, 230, 152)';
	else (opacity > 0.3)
		return 'rgb(173, 235, 173)';
}

getNegativeMoveWithOpacity = function(opacity) {
	if (opacity > 0.9)
		return 'rgb(205, 50, 50)';
	else if (opacity > 0.8)
		return 'rgb(210, 70, 70)';
	else if (opacity > 0.7)
		return 'rgb(215, 91, 91)';
	else if (opacity > 0.6)
		return 'rgb(220, 111, 111)';
	else if (opacity > 0.5)
		return 'rgb(225, 132, 132)';
	else if (opacity > 0.4)
		return 'rgb(230, 152, 152)';
	else if (opacity > 0.3)
		return 'rgb(235, 173, 173)';
	else 
		return 'rgb(240, 193, 193)';
}

const COLORS = {
	"ODD_COLUMN" : "#1f77b4",
	"EVEN_COLUMN" : "#aec7e8",
	"POSITIVE_MOVE" : "#2ca02c",
	"NEGATIVE_MOVE" : "#d62728",
	"POSITIVE_MOVE_GRADIENT" : getPositiveMoveWithOpacity,
	"NEGATIVE_MOVE_GRADIENT" : getNegativeMoveWithOpacity,
	"MINIMAP_ROW" : "rgb(255, 255, 255)",
	"MINIMAP_ROW_SELECTED" : "rgb(99, 99, 99)",
	"CONSOLE_ROW" : "#337ab7",
	"FONT_COLOR_DARK" : "rgb(99, 99, 99)",
	"FONT_COLOR_LIGHT" : "rgb(189, 189, 189)",
	"GREY" : "#bdbdbd",
	"DARK_GREY" : "#636363",
	"SLATE" : "#555",
    "RANKCELL_BACKCOLOR" : "rgb(85, 85, 85)",
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

