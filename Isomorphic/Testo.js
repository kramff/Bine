(function () {
	var Testo = (function () {
		var Testo = function (options) {
			//...
			this.a = 3;
		}
		Testo.prototype.foo = function foo(b) {
			//...
			return this.a + b;
		}
		return Testo;
	})();

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
		module.exports = Testo;
	else
		window.Testo = Testo;
})();
