const attributeStates = {"HIGH" : 1, "LOW" : 2, "UNUSED" : 3};

/*Colors*/

getPositiveMoveWithOpacity = function(opacity) { 
	return 'rgba(88, 218, 91, ' + opacity + ')';
}

getNegativeMoveWithOpacity = function(opacity) {
	return 'rgba(218, 91, 88, ' + opacity + ')';
}

const COLORS = {
	"ODD_COLUMN" : "#f27997",
	"EVEN_COLUMN" : "#a27997",
	"POSITIVE_MOVE" : "#DA5B58",
	"NEGATIVE_MOVE" : "#58DA5B",
	"POSITIVE_MOVE_GRADIENT" : getPositiveMoveWithOpacity,
	"NEGATIVE_MOVE_GRADIENT" : getNegativeMoveWithOpacity,
	"MINIMAP_ROW" : "#337ab7",
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