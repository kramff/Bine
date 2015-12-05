canvas.addEventListener("touchstart", touchStart, false);
//element.addEventListener("touchmove", touchMove, false);
//element.addEventListener("touchend", touchEnd, false);
//element.addEventListener("touchcancel", touchCancel, false);

function touchStart (event) {
    var curX = event.targetTouches[0].pageX;
    var curY = event.targetTouches[0].pageY;

	mouseX = curX;
	mouseY = curY;
	mousePressed = true;
	editorActive = false;

	mouseTilesX = ScreenXToWorldX(mouseX, player.z);
	mouseTilesY = ScreenYToWorldY(mouseY, player.z);
	
	mouseMovement = true;


}

function touchEnd (event) {
//player.z = 100;
}
