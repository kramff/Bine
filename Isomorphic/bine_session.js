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
		var entityIDCounter = 0;
		function Entity (x, y, z, style, settings, rules, templates) {
			entityIDCounter ++;
			this.id = entityIDCounter;

			this.x = x;
			this.y = y;
			this.z = z;

			// style: {color, border}
			this.style = style;

			// settings: {gravity, solid}
			this.settings = settings;

			this.rules = rules;
			this.templates = templates;

			this.xMov = 0;
			this.yMov = 0;
			this.zMov = 0;
			this.moveTime = 0;
			this.moveDuration = 10;

			this.moveDirections = {up: false, down: false, left: false, right: false};
		}
		Entity.prototype.SetMoveDirections = function (up, down, left, right) {
			this.moveDirections.up = up;
			this.moveDirections.down = down;
			this.moveDirections.left = left;
			this.moveDirections.right = right;
		}
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

		var areaIDCounter = 0;
		function Area (x, y, z, xSize, ySize, zSize, settings, map, extra, style, rules, templates) {
			areaIDCounter ++;
			this.id = areaIDCounter;

			this.x = x;
			this.y = y;
			this.z = z;
			
			this.xSize = xSize;
			this.ySize = ySize;
			this.zSize = zSize;

			// settings: {simulate}
			this.settings = settings;

			this.map = map;
			this.extra = extra;

			// style: {color, border, background}
			this.style = areaStyle

			this.rules = rules;
			this.templates = templates;

			this.xMov = 0;
			this.yMov = 0;
			this.zMov = 0;
			this.moveTime = 0;
			this.moveDuration = 10;
		}
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
		var levelIDCounter = 0;
		function Level (name, areaData, entityData) {
			levelIDCounter ++;
			this.id = levelIDCounter;

			this.name = name;

			this.areaData = areaData;
			this.entityData = entityData;

			this.areas = [];
			this.areaCounter = 0;
			this.entities = [];
			this.entityCounter = 0;

			this.drawObjects = [];
		}
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
		Level.prototype.Clear = function () {
			this.areas = [];
			this.entities = [];
		}
		Level.prototype.Initalize = function () {
			this.Clear();
			for (var i = 0; i < this.areaData.areas.length; i++)
			{
				var areaData = this.areaData.areas[i];
				var newArea = new Area(areaData.x, areaData.y, areaData.z, areaData.xSize, areaData.ySize, areaData.zSize, true, areaData.map);
				areas.push(newArea);
				drawObjects.push(newArea);
			}
			for (var i = 0; i < this.entityData.entities.length; i++) {
				var entityData = this.entityData.entities[i];
				var newEntity = new Entity(entityData.x, entityData.y, entityData.z, entityData.style, entityData.settings, entityData.rules, entityData.templates);
				
				entities.push(newEntity);
				drawObjects.push(newEntity)
			}
		}
		Level.prototype.ExportLevel = function () {
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
			return JSON.stringify(levelData);
		}
		var Session = function (name, worldData) {
			// name: string
			this.name = name;

			// worldData: {levelDatas, tileData, worldRules}

			// levelDatas: [{name: string, data: string}, ...]
			this.levelDatas = worldData.levelDatas;
			this.levels = [];
			for (var i = 0; i < this.levelDatas.length; i++) {
				var lData = this.levelDatas[i];
				this.levels[i] = new Level(lData.name, lData.areaData, lData.entityData);
			}
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
			var exportData = {levelDatas: [], tileData: this.tileData, worldRules: this.worldRules};
			for (var i = 0; i < this.levels.length; i++)
			{
				var level = this.levels[i];
				exportData.levelDatas.push(level.ExportLevel());
			}
			return JSON.stringify(exportData);
		}
		Session.prototype.AddLevel = function () {
			// 
			var newLevel = new Level("level name", [], [])
		}
		Session.prototype.CreatePlayerEntity = function () {
			//
			var newPlayer = new Entity(0, 0, 0, {color: "#80FFFF", border: "#208080"}, {gravity: true, solid: true}, [], []);
			
			return newPlayer;
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
