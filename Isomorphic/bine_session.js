// bine_session.js
// code for game session

// A session has a world, which contains a set of levels and some other data


// var sessio = new Session("my session", {levelDatas: [], tileData: [], worldRules: []})

(function () {
	var IS_SERVER = false;
	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	{
		IS_SERVER = true;
	}

	var Session = (function () {
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
			this.rules = entityData.rules;
			this.templates = entityData.templates;

			this.xMov = 0;
			this.yMov = 0;
			this.zMov = 0;
			this.moveTime = 0;
			this.moveDuration = 10;

			this.moveDirections = {up: false, down: false, left: false, right: false};
		}
		Entity.prototype.Export = function() {
			var entityData = {
				id: this.id,
				x: this.x,
				y: this.y,
				z: this.z,
				style: this.style,
				settings: this.settings,
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
				}
			}
			else
			{
				// Not moving - able to start a movement
				if (this.moveDirections.up || this.moveDirections.down || this.moveDirections.left || this.moveDirections.right)
				{

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
		}

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

			this.xMov = 0;
			this.yMov = 0;
			this.zMov = 0;
			this.moveTime = 0;
			this.moveDuration = 10;
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

			this.drawObjects = [];

			// Prep areas
			this.areas = [];
			for (var i = 0; i < levelData.areaDatas.length; i++) {
				var areaData = levelData.areaDatas[i];
				var newArea = new Area(areaData);
				this.areas.push(newArea);
				drawObjects.push(newArea);
			}
			this.areaCounter = this.areas.length;

			// Prep entities
			this.entities = [];
			for (var i = 0; i < levelData.entityDatas.length; i++) {
				var entityData = levelData.entityDatas[i];
				var newEntity = new Entity(entityData);
				this.entities.push(newEntity);
				drawObjects.push(newEntity)
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
			this.drawObjects.push(newArea);
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
		/*Level.prototype.Clear = function () {
			this.areas = [];
			this.entities = [];
		}*/
		/*Level.prototype.Initalize = function () {
			this.Clear();
			for (var i = 0; i < this.areaData.areas.length; i++)
			{
				var areaData = this.areaData.areas[i];
				var newArea = new Area(areaData.x, areaData.y, areaData.z, areaData.xSize, areaData.ySize, areaData.zSize,
					areaData.map, areaData.extra, areaData.style, areaData.rules, areaData.templates);
				areas.push(newArea);
				drawObjects.push(newArea);
			}
			for (var i = 0; i < this.entityData.entities.length; i++) {
				var entityData = this.entityData.entities[i];
				var newEntity = new Entity(entityData.x, entityData.y, entityData.z, entityData.style, entityData.settings, entityData.rules, entityData.templates);
				
				entities.push(newEntity);
				drawObjects.push(newEntity)
			}
		}*/
		/*Level.prototype.ExportLevel = function () {
			var levelData = {areas:[], entities:[], player:{x: 0, y: 0, z: 0}};
			for (var i = 0; i < this.areas.length; i++)
			{
				var area = this.areas[i];
				var areaDataObj = {
					x: area.x,
					y: area.y,
					z: area.z,
					xSize: area.xSize,
					ySize: area.ySize,
					zSize: area.zSize,
					map: area.map,
					rules: 0,
				};
				levelData.areas.push(areaDataObj); 
			}
			for (var i = 0; i < this.entities.length; i++)
			{
				var entity = this.entities[i];
				if (entity !== player)
				{
					var entityDataObj = {
						x: entity.x,
						y: entity.y,
						z: entity.z,
						style: entity.style,
						settings: entity.settings,
						rules: entity.rules,
						templates: entity.templates
					};
					levelData.entities.push(entityDataObj)
				}
			}
			return levelData;
			// return JSON.stringify(levelData);
		}*/
		function Session (name, worldData) {
			this.type = "Session";
			// name: string
			this.name = name;

			// worldData: {levelDatas, tileData, worldRules}

			// levelDatas: [{name: string, data: string}, ...]
			// this.levelDatas = worldData.levelDatas;
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
		/*Session.prototype.ExportLevel = function (levelID) {
			var level = this.GetLevelByID(levelID);
			return level.ExportLevel();
		}*/
		Session.prototype.AddLevel = function(levelData) {
			//var newArea = new Area(areaData);
			//this.areas.push(newArea);
			//this.drawObjects.push(newArea);
			//return newArea;
			var newLevel = new Level(levelData);
			this.levels.push(newLevel);
			return newLevel;
		};
		/*Session.prototype.AddLevel = function () {
			levelIDCounter ++;
			var blankLevelData = {
				name: "level name",
				id: levelIDCounter,
				entityDatas: [],
				areaDatas: [],
			}
			var newLevel = new Level(blankLevelData);
			this.levels.push(newLevel);
			return newLevel;
		}
		Session.prototype.AddLevelWithID = function (levelID) {
			// levelIDCounter ++;
			var blankLevelData = {
				name: "level name",
				id: levelID,
				entityDatas: [],
				areaDatas: [],
			}
			var newLevel = new Level(blankLevelData);
			this.levels.push(newLevel);
			return newLevel;
		}*/
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

		// Session.prototype.AddArea = function(levelID, areaData) {
		// 	var level = this.GetLevelByID(levelID);
		// 	console.log(level);
		// 	var newArea = new Area(areaData);
		// 	level.areas.push(newArea);
		// 	level.drawObjects.push(newArea);
		// 	return newArea.id;
		// };
		/*Session.prototype.AddAreaWithID = function(levelID, areaData, areaID) {
			var level = this.GetLevelByID(levelID);
			if (!level) throw "no level with id " + levelID;

			var newArea = new Area(areaData);
			newArea.id = areaID;
			level.areas.push(newArea);
			level.drawObjects.push(newArea);
			return newArea.id;
		};*/
		// Session.prototype.GetAreaByID = function(levelID, areaID) {
		// 	var level = this.GetLevelByID(levelID);
		// 	var id = Number(areaID);
		// 	var result = level.areas.filter(function (area) {
		// 		return area.id === id;
		// 	});
		// 	if (result[0] !== undefined)
		// 	{
		// 		return result[0];
		// 	}
		// };
		/*Session.prototype.ExportArea = function(levelID, areaID) {
			var area = this.GetAreaByID(levelID, areaID);
			var areaDataObj = {
				x: area.x,
				y: area.y,
				z: area.z,
				xSize: area.xSize,
				ySize: area.ySize,
				zSize: area.zSize,
				map: area.map,
				rules: 0,
			};31
			// return JSON.stringify(areaDataObj);
			return areaDataObj;
		};*/

		Session.prototype.EditTile = function(levelID, areaID, tileData) {
			var level = this.GetLevelByID(levelID);
			var area = level.GetAreaByID(levelID, areaID);
			area.map[tileData.x][tileData.y][tileData.z] = tileData.tile;
			// area.extra[tileData.x][tileData.y][tileData.z] = tileData.extra;
		};

		Session.prototype.CreatePlayerEntity = function (levelID) {
			//
			var newPlayer = new Entity(0, 0, 0, {color: "#80FFFF", border: "#208080"}, {gravity: true, solid: true}, [], []);
			var level = this.GetLevelByID(levelID);
			return newPlayer.id;
		}
		Session.prototype.CreateEntity = function (levelID) {
			//
			var newEntity = new Entity(0, 0, 0, {color: "#80FFFF", border: "#208080"}, {gravity: true, solid: true}, [], []);
			
			return newEntity.id;
		}
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
