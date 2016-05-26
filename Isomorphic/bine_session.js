// bine_session.js
// code for game session

// A session has a world, which contains a set of levels and some other data

(function () {
	var IS_SERVER = false;
	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	{
		IS_SERVER = true;
	}

	var Session = (function () {
		function Entity (x, y, z, style, rules, templates) {
			this.x = x;
			this.y = y;
			this.z = z;

			// style: {color, border}
			this.style = style;

			this.rules = rules;
			this.templates = templates;

			this.xMov = 0;
			this.yMov = 0;
			this.zMov = 0;
			this.moveDelay = 0;
			this.delayTime = 10;
		}
		Entity.prototype.Update = function () {
			// 
		}

		function Area (x, y, z, xSize, ySize, zSize, map, extra, style, rules, templates) {
			this.x = x;
			this.y = y;
			this.z = z;
			
			this.xSize = xSize;
			this.ySize = ySize;
			this.zSize = zSize;

			this.map = map;
			this.extra = extra;

			// style: {color, border, background}
			this.style = areaStyle

			this.rules = rules;
			this.templates = templates;

			this.xMov = 0;
			this.yMov = 0;
			this.zMov = 0;
			this.moveDelay = 0;
			this.delayTime = 10;
		}
		Area.prototype.Update = function () {
			// 
		}
		function Level (name, areaData, entityData) {
			this.name = name;

			this.areaData = areaData;
			this.entityData = entityData;

			this.areas = [];
			this.areaCounter = 0;
			this.entities = [];
			this.entityCounter = 0;
		}
		Level.prototype.Update = function () {
			for (var i = 0; i < this.entities.length; i++)
			{
				// Update entitites
				var entity = this.entities[i];
				entity.Update();
			}
			for (var i = 0; i < this.areas.length; i++)
			{
				// Update areas
				var area = this.areas[i];
				area.Update();
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
				var newEntity = new Entity(entityData.x, entityData.y, entityData.z);
				newEntity.rules = entityData.rules;
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
						rules: entity.rules,
					};
					levelData.entities.push(entityDataObj)
				}
			}
			return JSON.stringify(levelData);
		}
		var Session = function (sessionName, worldData) {
			// SessionName: string
			this.sessionName = sessionName;

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
		Session.prototype.AddLevel = function () {
			// 
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
