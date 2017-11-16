// bine_rules.js
// Rule processing code

var triggers = {

	// When a different entity steps adjacent to this one
	entity_steps_adjacent: {
		text: "Entity Steps Adjacent -> [Entity]",
		createVariables: ["entity"],
	},
};

var effects = {
	say_message: {
		text: "Say Message",
		requiredVariables: ["text"],
		effectFunction: function (argument) {
			console.log("say_message effect happened");
		},
	}
};

var conditions = {
	variable_condition: {
		text: "Variable Meets Criteria",
		requiredVariables: ["value", "comparison", "value"],
		conditionFunction: function (argument) {
			console.log("variable_condition condition happened");
		},
	}
}