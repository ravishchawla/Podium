const attributeStates = {"HIGH" : 1, "LOW" : 2, "UNUSED" : 3};

/*Colors*/

getPositiveMoveWithOpacity = function(opacity) { 
	if (opacity > 0.9)
		return 'rgb(18, 84, 19)';
	else if (opacity > 0.8)
		return 'rgb(22, 105, 24)';
	else if (opacity > 0.7)
		return 'rgb(27, 126, 28)';
	else if (opacity > 0.6)
		return 'rgb(31, 147, 33)';
	else if (opacity > 0.5)
		return 'rgb(36, 168, 38)';
	else if (opacity > 0.4)
		return 'rgb(40, 189, 43)';
	else if (opacity > 0.3)
		return 'rgb(45, 210, 47)';
	else if (opacity > 0.2)
		return 'rgb(66, 215, 68)';
	else if (opacity > 0.1)
		return 'rgb(87, 219, 89)';
	
	return 'rgb(108, 224, 110)';
}

getNegativeMoveWithOpacity = function(opacity) {
	if (opacity > 0.9)
		return 'rgb(84, 19, 18)';
	else if (opacity > 0.8)
		return 'rgb(105, 24, 22)';
	else if (opacity > 0.7)
		return 'rgb(126, 28, 27)';
	else if (opacity > 0.6)
		return 'rgb(147, 33, 31)';
	else if (opacity > 0.5)
		return 'rgb(168, 38, 36)';
	else if (opacity > 0.4)
		return 'rgb(189, 43, 40)';
	else if (opacity > 0.3)
		return 'rgb(210, 47, 45)';
	else if (opacity > 0.2)
		return 'rgb(215, 68, 66)';
	else if (opacity > 0.1)
		return 'rgb(219, 89, 87)';
	
	return 'rgb(224, 110, 108)';
}

const COLORS = {
	"ODD_COLUMN" : "#83AA30",
	"EVEN_COLUMN" : "#A68F58",
	"ODD_COLUMN_EXPECT" : "#d399e8",
	"EVEN_COLUMN_EXPECT" : "#969Deb",
	"POSITIVE_MOVE" : "#58DA5B",
	"NEGATIVE_MOVE" : "#DA5B58",
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
	"BLACK" : "rgb(0,0,0)",
	"TRANSPARENT" : "rgba(0, 0, 0, 0)",
	"WHITE" : "rgb(255, 255, 255)",
	"BLUE" : "#337ab7",
	"RED" : "#FF0000",
};

const legendItems = [//[COLORS.ODD_COLUMN, "Column 1 value"],
					 //[COLORS.EVEN_COLUMN , "Column 2 value"],
					 //[COLORS.ODD_COLUMN_EXPECT, "Column 1 expected value"],
					 //[COLORS.EVEN_COLUMN_EXPECT, "Column 2 expected value"],
					 [COLORS.POSITIVE_MOVE, "Row moved up in ranking"],
					 [COLORS.NEGATIVE_MOVE, "Row moved down in ranking"],
					 [COLORS.MINIMAP_ROW, "Row didn't move in ranking"],
					 [COLORS.MINIMAP_ROW_SELECTED, "Watched row"]
					];

const TABS = {"MINIMAP" : "minimapTab", "CONSOLE" : "consoleTab" , "LEGEND" : "legendTab"};

