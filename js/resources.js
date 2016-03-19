const attributeStates = {"HIGH" : 1, "LOW" : 2, "UNUSED" : 3};

/*Colors*/

getPositiveMoveWithOpacity = function(opacity) { 
	return 'rgba(88, 218, 91, ' + opacity + ')';
}

getNegativeMoveWithOpacity = function(opacity) {
	return 'rgba(218, 91, 88, ' + opacity + ')';
}

const COLORS = {
	"ODD_COLUMN" : "#83AA30",
	"EVEN_COLUMN" : "#A68F58",
	"ODD_COLUMN_EXPECT" : "#d399e8",
	"EVEN_COLUMN_EXPECT" : "#969Deb",
	"POSITIVE_MOVE" : "#DA5B58",
	"NEGATIVE_MOVE" : "#58DA5B",
	"POSITIVE_MOVE_GRADIENT" : getPositiveMoveWithOpacity,
	"NEGATIVE_MOVE_GRADIENT" : getNegativeMoveWithOpacity,
	"MINIMAP_ROW" : "rgb(255, 255, 255)",
	"MINIMAP_ROW_SELECTED" : "rgb(99, 99, 99)",
	"CONSOLE_ROW" : "#337ab7",
	"FONT_COLOR_DARK" : "rgb(99, 99, 99)",
	"FONT_COLOR_LIGHT" : "rgb(189, 189, 189)",
	"GREY" : "#bdbdbd",
	"DARK_GREY" : "#636363",
	"BLACK" : "rgb(0,0,0)",
	"TRANSPARENT_BLACK" : "rgba(0, 0, 0, 0)",
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

