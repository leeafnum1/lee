var killBackSpace = function(e) {
	e = e ? e : window.event;
	var t = e.target ? e.target : e.srcElement ? e.srcElement : null;
	if (t
			&& t.tagName
			&& (t.type && /(password)|(text)|(file)/.test(t.type.toLowerCase()))
			|| t.tagName.toLowerCase() == 'textarea') {
		return true;
	}
	var k = e.keyCode ? e.keyCode : e.which ? e.which : null;
	if (k == 8) {
		if (e.preventDefault) {
			e.preventDefault();
		}
		return false;
	}
	return true;
};
if (typeof document.addEventListener != 'undefined') {
	document.addEventListener('keydown', killBackSpace, false);
} else if (typeof document.attachEvent != 'undefined') {
	document.attachEvent('onkeydown', killBackSpace);
} else {
	if (document.onkeydown != null) {
		var oldOnkeydown = document.onkeydown;
		document.onkeydown = function(e) {
			oldOnkeydown(e);
			killBackSpace(e);
		};
	} else {
		document.onkeydown = killBackSpace;
	}
}
history.pushState(null, document.title, location.href);
window.addEventListener('popstate', function(event) {
	history.pushState(null, document.title, location.href);
});
