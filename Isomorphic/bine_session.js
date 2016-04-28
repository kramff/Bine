// bine_session.js
// code for game session
// contains a set of levels

(function () {
	var Session = (function () {
		var Level = function (lData) {
			this.levelData = lData.data;
			this.levelName = lData.name;

			this.areas = [];
			this.areaCounter = 0;
			this.entities = [];
			this.entityCounter = 0;
		}
		Level.prototype.Clear = function () {
			this.areas = [];
			this.entities = [];
		}
		Level.prototype.Initalize = function () {
			var parsedData = JSON.parse(this.levelData);
			if (parsedData === null)
			{
				console.error("Null leveldata!");
			}
			this.ClearLevel();
			for (var i = 0; i < parsedData.areas.length; i++)
			{
				var areaData = importedData.areas[i];
				var newArea = new Area(areaData.x, areaData.y, areaData.z, areaData.xSize, areaData.ySize, areaData.zSize, true, areaData.map);
				areas.push(newArea);
				drawObjects.push(newArea);
			}
			for (var i = 0; i < importedData.entities.length; i++) {
				var entityData = importedData.entities[i];
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
			for (var i = 0; i < levelDatas.length; i++) {
				var lData = levelDatas[i].data;
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

			// particleData

		}
		Session.prototype.foo = function foo(b) {
			//...
			return this.a + b;
		}
		return Session;
	})();

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
		module.exports = Session;
	else
		window.Session = Session;
})();
