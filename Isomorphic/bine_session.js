// bine_session.js
// code for game session

// A session has a world, which contains a set of levels and some other data

var FALL_SPEED_START = 5;
var FALL_SPEED_MIN = 2;
var MOVE_CANCEL_TIME = 3;
var MOVE_SPEED = 10;

// var sessio = new Session("my session", {levelDatas: [], tileData: [], worldRules: []})

(function () {

var IS_SERVER = false;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
{
	IS_SERVER = true;
}

// Turn on to debug events
var EVENT_DEBUGGING = false;

var Session = (function () {

	// Events: triggers, conditions, effects
	var triggers = {

		// When a different entity steps adjacent to this one
		entity_steps_adjacent: {
			text: "Entity Steps Adjacent -> [Entity]",
			createdVariables: [
				{
					name: "adjacent_entity",
					type: "entity",
				},
			],
		},
	};
	var conditions = {
		variable_condition: {
			text: "Variable Meets Criteria",
			requiredVariables: ["value", "comparison", "value"],
			conditionFunction: function (variables, levelRef, entityRef, useVariables) {
				console.log("variable_condition condition happened");
				return true;
			},
		},
	}
	var effects = {
		say_message: {
			text: "Say Message",
			requiredVariables: ["text"],
			effectFunction: function (variables, levelRef, entityRef, useVariables) {
				console.log("say_message effect happened");
			},
		},
	};

	// var entityIDCounter = 0;
	//x, y, z, style, settings, rules, templates
	function Entity (entityData) {
		this.type = "Entity";

		this.id = entityData.id
		this.x = entityData.x;
		this.y = entityData.y;
		this.z = entityData.z;
		this.style = entityData.style;
		this.settings = entityData.settings;
		this.variables = entityData.variables;
		this.rules = entityData.rules;
		this.templates = entityData.templates;
		this.variableCounter = entityData.variableCounter;

		this.xMov = 0;
		this.yMov = 0;
		this.zMov = 0;
		this.moveTime = 0;
		this.moveDuration = MOVE_SPEED;

		this.falling = false;
		this.fallSpeed = FALL_SPEED_START;

		this.moveDirections = {up: false, down: false, left: false, right: false, changed: false};

		this.xCorrection = 0;
		this.yCorrection = 0;
		this.zCorrection = 0;
		this.needCorrection = false;
		this.xMovCorrection = 0;
		this.yMovCorrection = 0;
		this.zMovCorrection = 0;
		this.moveTimeCorrection = 0;
		this.moveDurationCorrection = MOVE_SPEED;

		this.tempMessageString = "";
		this.tempMessageTime = 0;
	}
	Entity.prototype.Export = function() {
		var entityData = {
			id: this.id,
			x: this.x,
			y: this.y,
			z: this.z,
			style: this.style,
			settings: this.settings,
			variables: this.variables,
			variableCounter: this.variableCounter,
			rules: this.rules,
			templates: this.templates,
		};
		return entityData;
	};
	Entity.prototype.Update = function (levelRef) {
		// Update an entity:
		// - Input (if player-controlled)
		// - Rules
		// - Movement

		if (this.tempMessageTime > 0)
		{
			this.tempMessageTime -= 1;
		}
		else
		{
			this.tempMessageString = "";
		}

		// Position Correction (Needs to be smoother)
		if (this.needCorrection)
		{
			this.needCorrection = false;
			this.x = this.xCorrection;
			this.y = this.yCorrection;
			this.z = this.zCorrection;
			this.xMov = this.xMovCorrection;
			this.yMov = this.yMovCorrection;
			this.zMov = this.zMovCorrection;
			this.moveTime = this.moveTimeCorrection;
			this.moveDuration = this.moveDurationCorrection;
		}

		// one tick of movement
		if (this.xMov !== 0 || this.yMov !== 0 || this.zMov !== 0)
		{
			this.moveTime ++;
			if (this.moveTime >= this.moveDuration)
			{
				// end movement if done
				this.moveTime = 0;
				this.x += this.xMov;
				this.y += this.yMov;
				this.z += this.zMov;
				this.xMov = 0;
				this.yMov = 0;
				this.zMov = 0;
				this.TriggerStepEnd(levelRef);
			}
		}
		// Not moving - able to start a movement
		// OR started moving ~3 or fewer frames ago, able to cancel into other movements
		if ((this.xMov === 0 && this.yMov === 0 && this.zMov === 0) || (this.moveTime < MOVE_CANCEL_TIME && this.moveDirections.changed))
		{
			var floorSolid = levelRef.CheckRelativeLocationSolid(this, 0, 0, -1);
			// Solid ground below player (Floor): Can move if solid
			if (floorSolid)
			{
				this.moveDirections.changed = false;
				this.falling = false;
				this.fallSpeed = FALL_SPEED_START
				// Input for movement
				if (this.moveDirections.up || this.moveDirections.down || this.moveDirections.left || this.moveDirections.right)
				{
					// Set movement based on input
					this.xMov = (this.moveDirections.left ? -1 : 0) + (this.moveDirections.right ? 1 : 0);
					this.yMov = (this.moveDirections.up ? -1 : 0) + (this.moveDirections.down ? 1 : 0);
					this.zMov = 0;
					this.moveDuration = MOVE_SPEED;

					var ceilSolid = levelRef.CheckRelativeLocationSolid(this, 0, 0, 1);
					// Adjust movement for walls/other obstacles
					// If player is moving diagonally, check if the x or y aspect is blocked
					if (this.xMov !== 0 && this.yMov !== 0)
					{
						// DIAGRAM (SIDE VIEW):
						// ceil  above
						// |   /
						// E --- space
						// |   \
						// floor below

						// Space next to entity
						var xSpaceSolid = levelRef.CheckRelativeLocationSolid(this, this.xMov, 0, 0);
						var ySpaceSolid = levelRef.CheckRelativeLocationSolid(this, 0, this.yMov, 0);
						// Space above that space (Diagonally above the entity)
						var xAboveSolid = levelRef.CheckRelativeLocationSolid(this, this.xMov, 0, 1);
						var yAboveSolid = levelRef.CheckRelativeLocationSolid(this, 0, this.yMov, 1);
						// Space directly above the entity

						// Check if X direction is blocked
						if (xSpaceSolid && (xAboveSolid || ceilSolid))
						{
							this.xMov = 0;
						}
						// Check if Y direction is blocked
						if (ySpaceSolid && (yAboveSolid || ceilSolid))
						{
							this.yMov = 0;
						}
					}

					// Check if any movement is still happening
					// If so, do final movement adjustments (Up/down stairs, corner walls)
					if (this.xMov !== 0 || this.yMov !== 0)
					{
						var spaceSolid = levelRef.CheckRelativeLocationSolid(this, this.xMov, this.yMov, 0);
						var aboveSolid = levelRef.CheckRelativeLocationSolid(this, this.xMov, this.yMov, 1);
						// Space below that space (Diagonally below the entity)
						var belowSolid = levelRef.CheckRelativeLocationSolid(this, this.xMov, this.yMov, -1);
						if (spaceSolid)
						{
							if (aboveSolid || ceilSolid)
							{
								// Blocked off
								this.xMov = 0;
								this.yMov = 0;
								this.zMov = 0;
								this.moveTime = 0;
							}
							else
							{
								// Upwards movement (stairs)
								this.zMov = 1;
							}
						}
						else if (!belowSolid)
						{
							// Downwards movement (stairs down or pit)
							this.zMov = -1;
						}
					}
					// Stop movement
					else
					{
						this.xMov = 0;
						this.yMov = 0;
						this.zMov = 0;
						this.moveTime = 0;
					}
				}
				// Stop movement
				else
				{
					this.xMov = 0;
					this.yMov = 0;
					this.zMov = 0;
					this.moveTime = 0;
				}
			}
			// Player falls down
			else
			{
				this.moveDuration = this.fallSpeed;
				this.zMov = -1;
				if (this.falling && this.fallSpeed > FALL_SPEED_MIN)
				{
					this.fallSpeed --;
				}
				this.falling = true;
			}
		}
	}
	Entity.prototype.GetX = function() {
		return this.x + (this.xMov * this.moveTime / this.moveDuration);
	};
	Entity.prototype.GetY = function() {
		return this.y + (this.yMov * this.moveTime / this.moveDuration);
	};
	Entity.prototype.GetZ = function() {
		return this.z + (this.zMov * this.moveTime / this.moveDuration);
	};
	Entity.prototype.SetMoveDirections = function (up, down, left, right) {
		this.moveDirections.up = up;
		this.moveDirections.down = down;
		this.moveDirections.left = left;
		this.moveDirections.right = right;
		this.moveDirections.changed = true;
	}
	Entity.prototype.SetLocationCorrection = function (x, y, z, xMov, yMov, zMov, moveTime, moveDuration) {
		this.xCorrection = x;
		this.yCorrection = y;
		this.zCorrection = z;
		this.xMovCorrection = xMov;
		this.yMovCorrection = yMov;
		this.zMovCorrection = zMov;
		this.moveTimeCorrection = moveTime;
		this.moveDurationCorrection = moveDuration;
		this.needCorrection = true;
	};
	// Event handling
	// Is this funcion needed? May only need version that immediately runs rules if they're present
	Entity.prototype.CheckHaveTrigger = function (triggerType) {
		// Could be improved to not have to loop through all rules every time
		for (var i = 0; i < this.rules.length; i++)
		{
			var rule = this.rules[i];
			if (rule.trigger !== undefined && rule.trigger === triggerType)
			{
				return true;
			}
		}
		return false;
	}
	// If the entity has the specified trigger type, run that rule
	// extra - anything else that needs to be passed to rule
	Entity.prototype.FireTrigger = function (triggerType, extra, levelRef) {
		for (var i = 0; i < this.rules.length; i++)
		{
			var rule = this.rules[i];
			if (rule.trigger !== undefined && rule.trigger === triggerType)
			{
				this.ExecuteRule(rule, extra, levelRef);
				// Only executes first instance of rule... is this correct?
				return;
			}
		}
		return;
	};
	// Step adjacent trigger
	Entity.prototype.TriggerStepEnd = function (levelRef) {
		for (var i = 0; i < levelRef.entities.length; i++)
		{
			var otherEntity = levelRef.entities[i];
			if (IsNear(this.x, this.y, this.z, otherEntity.x, otherEntity.y, otherEntity.z, 1))
			{
				// No need to check if rule exists before running it?
				// if (otherEntity.CheckHaveTrigger("entity_steps_adjacent"))
				// {
				// }
				otherEntity.FireTrigger("entity_steps_adjacent", this, levelRef)
			}
		}
	};
	// Execute an entity's rule
	Entity.prototype.ExecuteRule = function(rule, variables, levelRef) {
		var entityRef = this;
		if (rule.trigger)
		{
			// Trigger - Go ahead and run the rule block.
			var trigger = triggers[rule.trigger];
			if (EVENT_DEBUGGING)
			{
				console.log(trigger.text);
			}
			this.ExecuteBlock(rule.block, variables, levelRef);
		}
		else if (rule.condition)
		{
			// Condition - Check the condition, then run the true or false block
			var condition = conditions[rule.condition];
			if (EVENT_DEBUGGING)
			{
				console.log(condition.text);
			}
			var result = condition.conditionFunction(variables, levelRef, entityRef, condition.useVariables);
			if (result === true)
			{
				this.ExecuteBlock(rule.trueBlock, variables, levelRef);
			}
			// False by default?
			else
			{
				this.ExecuteBlock(rule.falseBlock, variables, levelRef);
			}
		}
		else if (rule.effect)
		{
			// Effect - Do something. (End result)
			var effect = effects[rule.effect];
			if (EVENT_DEBUGGING)
			{
				console.log(effect.text);
			}
			// Is there a result from an effect????
			// Should just be "side effects"?
			var result = effect.effectFunction(variables, levelRef, entityRef, effect.useVariables);
		}
	};
	Entity.prototype.ExecuteBlock = function(ruleBlock, variables, levelRef) {
		// Loop through the block and execute each rule in it
		for (var i = 0; i < ruleBlock.length; i++)
		{
			var rule = ruleBlock[i];
			this.ExecuteRule(rule, variables, levelRef);
		}
	};

	// var areaIDCounter = 0;
	//x, y, z, xSize, ySize, zSize, settings, map, extra, style, rules, templates
	function Area (areaData) {
		this.type = "Area";

		this.id = areaData.id;

		this.x = areaData.x;
		this.y = areaData.y;
		this.z = areaData.z;
		
		this.xSize = areaData.xSize;
		this.ySize = areaData.ySize;
		this.zSize = areaData.zSize;

		this.settings = areaData.settings;
		this.map = areaData.map;
		this.extra = areaData.extra;
		this.style = areaData.style;
		this.rules = areaData.rules;
		this.templates = areaData.templates;

		// Fill in with empty if map isn't exported
		if (areaData.map === undefined || areaData.map.length === 0)
		{
			this.map = [];
			for (var i = 0; i < this.xSize; i++)
			{
				var xLayer = [];
				for (var j = 0; j < this.ySize; j++)
				{
					var yLayer = [];
					for (var k = 0; k < this.zSize; k++)
					{
						// Fill with 0 for empty
						var zLayer = 0;
						yLayer.push(zLayer);
					}
					xLayer.push(yLayer)
				}
				this.map.push(xLayer);
			}
		}

		this.xMov = 0;
		this.yMov = 0;
		this.zMov = 0;
		this.moveTime = 0;
		this.moveDuration = MOVE_SPEED;
	}
	Area.prototype.Export = function() {
		var areaData = {
			id: this.id,
			x: this.x,
			y: this.y,
			z: this.z,
			xSize: this.xSize,
			ySize: this.ySize,
			zSize: this.zSize,
			settings: this.settings,
			map: this.map,
			extra: this.extra,
			style: this.style,
			rules: this.rules,
			templates: this.templates,
		};
		return areaData;
	};
	Area.prototype.Update = function (levelRef) {
		// Update an area:
		// - Rules
		// - Movement
		// - Simulations

		// Rules

		// Movement

		if (this.xMov !== 0 || this.yMov !== 0 || this.zMov !== 0)
		{
			this.moveTime ++;
			if (this.moveTime >= this.moveDuration)
			{
				this.moveTime = 0;
				this.x += this.xMov;
				this.y += this.yMov;
				this.z += this.zMov;
				this.xMov = 0;
				this.yMov = 0;
				this.zMov = 0;
			}
		}

		// Simulations
	}
	Area.prototype.GetX = function() {
		return this.x + (this.xMov * this.moveTime / this.moveDuration);
	};
	Area.prototype.GetY = function() {
		return this.y + (this.yMov * this.moveTime / this.moveDuration);
	};
	Area.prototype.GetZ = function() {
		return this.z + (this.zMov * this.moveTime / this.moveDuration);
	};

	function Level (levelData) {
		this.type = "Level";

		this.id = levelData.id
		this.name = levelData.name;

		if (!IS_SERVER)
		{
			this.drawObjects = [];
		}

		// Prep areas
		this.areas = [];
		for (var i = 0; i < levelData.areaDatas.length; i++) {
			var areaData = levelData.areaDatas[i];
			var newArea = new Area(areaData);
			this.areas.push(newArea);
			if (!IS_SERVER)
			{
				this.drawObjects.push(newArea);
			}
		}
		this.areaCounter = this.areas.length;

		// Prep entities
		this.entities = [];
		for (var i = 0; i < levelData.entityDatas.length; i++) {
			var entityData = levelData.entityDatas[i];
			var newEntity = new Entity(entityData);
			this.entities.push(newEntity);
			if (!IS_SERVER)
			{
				this.drawObjects.push(newEntity);
			}
		}
		this.entityCounter = this.entities.length;
	}
	Level.prototype.Export = function() {
		var areaDatas = [];
		for (var i = 0; i < this.areas.length; i++)
		{
			areaDatas.push(this.areas[i].Export());
		}
		var entityDatas = [];
		for (var i = 0; i < this.entities.length; i++)
		{
			entityDatas.push(this.entities[i].Export());
		}
		var levelData = {
			id: this.id,
			name: this.name,
			areaDatas: areaDatas,
			entityDatas: entityDatas,
		};
		return levelData;
	};
	Level.prototype.Update = function () {
		for (var i = 0; i < this.entities.length; i++)
		{
			// Update entitites
			var entity = this.entities[i];
			entity.Update(this);
		}
		for (var i = 0; i < this.areas.length; i++)
		{
			// Update areas
			var area = this.areas[i];
			area.Update(this);
		}
	}
	Level.prototype.AddArea = function(areaData) {
		var newArea = new Area(areaData);
		this.areas.push(newArea);
		if (!IS_SERVER)
		{
			this.drawObjects.push(newArea);
		}
		return newArea;
	};
	Level.prototype.GetAreaByID = function(areaID) {
		var id = Number(areaID);
		var result = this.areas.filter(function (area) {
			return area.id === id;
		});
		if (result[0] !== undefined)
		{
			return result[0];
		}
	};
	Level.prototype.RemoveArea = function(areaID) {
		var area = this.GetAreaByID(areaID);
		if (!IS_SERVER)
		{
			this.drawObjects.splice(this.drawObjects.indexOf(area), 1);
		}
		this.areas.splice(this.areas.indexOf(area), 1);
	};
	Level.prototype.AddEntity = function(entityData) {
		var newEntity = new Entity(entityData);
		this.entities.push(newEntity);
		if (!IS_SERVER)
		{
			this.drawObjects.push(newEntity);
		}
		return newEntity;
	};
	Level.prototype.GetEntityByID = function(entityID) {
		var id = Number(entityID);
		var result = this.entities.filter(function (entity) {
			return entity.id === id;
		});
		if (result[0] !== undefined)
		{
			return result[0];
		}
	};
	Level.prototype.CheckLocationSolid = function(x, y, z) {
		for (var i = 0; i < this.areas.length; i++)
		{
			var area = this.areas[i];
			if (x >= area.x && x < area.x + area.xSize &&
				y >= area.y && y < area.y + area.ySize &&
				z >= area.z && z < area.z + area.zSize)
			{
				//Within area's bounds
				var tile = area.map[x - area.x][y - area.y][z - area.z];
				if (TileIsSolid(tile))
				{
					return true;
				}
			}
			//if (area.xMov !== 0 || area.yMov !== 0 || area.zMov !== 0)
			//{
			//	//Area is moving: check new bounds
			//	if (x >= area.x + area.xMov && x < area.x + area.xMov + area.xSize &&
			//		y >= area.y + area.yMov && y < area.y + area.yMov + area.ySize &&
			//		z >= area.z + area.zMov && z < area.z + area.zMov + area.zSize)
			//	{
			//		var tile = area.map[x - area.x - area.xMov][y - area.y - area.yMov][z - area.z - area.zMov];
			//		if (TileIsSolid(tile))
			//		{
			//			return true;
			//		}
			//	}
			//}
		}
		return false;
	};
	Level.prototype.CheckRelativeLocationSolid = function(entity, x, y, z) {
		return this.CheckLocationSolid(entity.x + x, entity.y + y, entity.z + z);
	};
	Level.prototype.GetAreaAtLocation = function(x, y, z) {
		for (var i = 0; i < this.areas.length; i++)
		{
			var area = this.areas[i];
			if (x >= area.x && x < area.x + area.xSize &&
				y >= area.y && y < area.y + area.ySize &&
				z >= area.z && z < area.z + area.zSize)
			{
				//Within area's bounds
				return area;
			}
		}
		return undefined;
	};
	Level.prototype.GetEntityAtLocation = function(x, y, z) {
		for (var i = 0; i < this.entities.length; i++)
		{
			var entity = this.entities[i];
			if (x === entity.x &&
				y === entity.y &&
				z === entity.z)
			{
				// On entity's location
				return entity;
			}
		}
		return undefined;
	};
	function TileIsSolid(tile) {
		if (tile !== 0)
		{
			return true;
		}
		return false;
	}
	function Session (name, worldData) {
		this.type = "Session";
		// name: string
		this.name = name;
		this.levels = [];
		for (var i = 0; i < worldData.levelDatas.length; i++) {
			var levelData = worldData.levelDatas[i];
			var newLevel = new Level(levelData);
			this.levels.push(newLevel);
		}
		this.levelCounter = this.levels.length;
		// tileData: [{name: string, solid: boolean, rules: [rules...]}, ...]
		this.tileData = worldData.tileData;

		// worldRules: [rules...]
		this.worldRules = worldData.worldRules;

		// entityTemplates: [entityTemplates...]
		// entityTemplate: {name: string, rules: [rules...], variables: [variables...]}
		this.entityTemplates = worldData.entityTemplates;

		// areaTemplates: [areaTemplates...]
		// areaTemplate: {name: string, rules: [rules...], variables: [variables...]}
		this.areaTemplates = worldData.areaTemplates;

		// itemData
		this.itemData = worldData.itemData;

		// particleData
		this.particleData = worldData.particleData;
	}
	Session.prototype.ExportWorld = function () {
		var levelDatas = [];
		for (var i = 0; i < this.levels.length; i++)
		{
			var level = this.levels[i];
			levelDatas.push(level.Export());
		}
		var worldData = {
			levelDatas: levelDatas,
			tileData: this.tileData,
			worldRules: this.worldRules,
			entityTemplates: this.entityTemplates,
			areaTemplates: this.areaTemplates,
			itemData: this.itemData,
			particleData: this.particleData,
		};
		return worldData;
	}
	Session.prototype.AddLevel = function(levelData) {
		var newLevel = new Level(levelData);
		this.levels.push(newLevel);
		return newLevel;
	};
	Session.prototype.GetLevelByID = function (id) {
		id = Number(id);
		var result = this.levels.filter(function (level) {
			return level.id === id;
		});
		if (result[0] !== undefined)
		{
			return result[0];
		}
		else
		{
			console.log("Couldn't find level with id: " + id);
		}
	}
	Session.prototype.EditTile = function(levelID, areaID, tileData) {
		var level = this.GetLevelByID(levelID);
		var area = level.GetAreaByID(areaID);
		area.map[tileData.x][tileData.y][tileData.z] = tileData.tile;
		// area.extra[tileData.x][tileData.y][tileData.z] = tileData.extra;
	};
	// Session.prototype.CreatePlayerEntity = function (levelID) {
	// 	//
	// 	var newPlayer = new Entity(0, 0, 0, {color: "#FFFFFF", border: "#208080"}, {gravity: true, solid: true}, [], []);
	// 	var level = this.GetLevelByID(levelID);
	// 	return newPlayer.id;
	// }
	// Session.prototype.CreateEntity = function (levelID) {
	// 	var newEntity = new Entity(0, 0, 0, {color: "#FF80FF", border: "#2080F0"}, {gravity: true, solid: true}, [], []);
		
	// 	return newEntity.id;
	// }
	Session.prototype.RemoveEntity = function (levelID, entityID) {
		var level = this.GetLevelByID(levelID);
		var entity = level.GetEntityByID(entityID);

		if (!IS_SERVER)
		{
			level.drawObjects.splice(level.drawObjects.indexOf(entity), 1);
		}
		level.entities.splice(level.entities.indexOf(entity), 1);
	}
	Session.prototype.ChangeEntity = function(levelID, entityID, entityData) {
		var level = this.GetLevelByID(levelID);
		var entity = level.GetEntityByID(entityID);

		// Update all values to the ones passed in, except for ID
		// entity.id = entityData.id
		entity.x = entityData.x;
		entity.y = entityData.y;
		entity.z = entityData.z;
		entity.style = entityData.style;
		entity.settings = entityData.settings;
		entity.variables = entityData.variables;
		entity.rules = entityData.rules;
		entity.templates = entityData.templates;
		entity.variableCounter = entityData.variableCounter;
	};
	Session.prototype.GetEntityByID = function (levelID, id) {
		var level = this.GetLevelByID(levelID);
		id = Number(id);
		var result = worldArray.filter(function (world) {
			return world.id === id;
		});
		if (result[0] !== undefined)
		{
			return result[0];
		}
	}
	Session.prototype.ExportTriggerData = function () {
		return triggers;
	}
	Session.prototype.ExportConditionData = function () {
		return conditions;
	}
	Session.prototype.ExportEffectData = function () {
		return effects;
	}
	return Session;
})();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
{
	module.exports = Session;
}
else
{
	window.Session = Session;
}

})();
