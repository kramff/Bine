(function () {
// Change EXPORT_NAME to something unique
var exportName = "EXPORT_NAME";
var MyExports = (function () {
var customEntities = [
	// Example of a custom entity
	{
		name: "My Entity",
		customVariables: {
			myMessage: "Example message!",
		},
	},
];
})();
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = MyExports;
}
else {
	window[exportName] = MyExports;
}
})();
