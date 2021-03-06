var self = module.exports

// =============================================================================
// framework packages

var _           = require('underscore');     // functional coding
var assert      = require("assert");

// meta4 packages

var files      = require('./files');     	// files helper

// =============================================================================

self.defaultAttributeId = "@rid";

self.accepts = {
	json: function(file, data) { return file.indexOf(".json")>0 },
    yaml: function(file, data) { return file.indexOf(".yaml")>0 },
	html: function(file, data) { return file.indexOf(".html")>0 },
	ecma: function(file, data) { return file.indexOf(".js")>0 }
}


self.reload = {

	all: function(feature, cache) {
        console.log("reload all: %j", feature);
        var cache = cache || {};

		_.each(feature.paths, function(fpath, key) {
            console.log("reload: %s -> %s", key, fpath);
			if ( _.isFunction(self.reload[key]) ) {
				// refresh uses closure to encapsulate feature/path state 
				files.mkdirs(fpath);
				cache[key] = self.reload[key](fpath, feature);
			}
		})
	    cache.now = new Date().getTime()

		// refresh uses closure to encapsulate feature 
		cache.refresh = function() {
			self.reload.all(feature, cache);
		}

		return cache
	},

	models: function(modelsDir, feature) {
        assert(modelsDir, "Missing modelsDir");
		var found  = files.find(modelsDir, self.accepts.json )
		var models = {}

		_.each( found, function(data, file) {
			if (!data) return
			try {
				var model = JSON.parse(data);
                assert(model, "Model data is missing: "+file);
			} catch(e) {
				console.log("Corrupt JSON:", file)
			}

			// only designated client models
			model.id = model.id || path.basename(file, ".json");
			model.label = model.label || model.id;
			model.collection = model.collection || model.id;
//            assert(![model.id], "Duplicate model exists: "+model.id);
			models[model.id] = model;
            model.adapter = model.adapter || {};

//            console.log("model: %j", model);

			if (_.isString(model.adapter)) {
				model.adapter = feature.adapter[model.adapter] || { idAttribute: self.defaultAttributeId };
			}

			model.isAttribute = model.isAttribute || model.adapter.isAttribute || self.defaultAttributeId;
			var isServer = model.isServer?true:proxy.adapter?true:false;

			// proxy models - from queries & filters
            if (model.queries) {
                _.each(model.queries, function(query, id) {
                    var proxy = _.extend({ id: model.collection+"/"+id, collection: model.collection, can: { read: true },
                        label: model.label + " ("+id+")", idAttribute: model.isAttribute,
                        debug: model.debug, prefetch: model.prefetch, type: model.type,
                        isProxy: true, isServer: isServer, isClient: model.isClient } )
                    if (proxy.isServer) proxy.adapter = _.extend( {}, model.adapter );
                    assert(![proxy.id], "Duplicate model exists: "+proxy.id);
                    models[proxy.id] = proxy;
                });
            }
            if (model.filters) {
                _.each(model.filters, function(filter, id) {
                    var proxy = _.extend({},
                        { id: model.collection+"/"+id, collection: model.collection,
                            can: { create: true, read: true, update: true, delete: true },
                            label: model.label + " ("+filter.id+")", idAttribute: model.isAttribute,
                            debug: model.debug, prefetch: model.prefetch, type: model.type,
                            isProxy: true, isServer: isServer, isClient: model.isClient },
                        filter);
                    if (proxy.isServer) proxy.adapter = _.extend( {}, model.adapter );
                    assert(![proxy.id], "Duplicate model exists: "+proxy.id);
                    models[proxy.id] = proxy;
                });
            }
//            console.log("UX model: %s", model.id)
		})
		return models
	},

    views: function(viewsDir) {
	    assert(viewsDir, "Missing viewsDir");
        var found  = files.find(viewsDir, self.accepts.json )
        console.log("UX: has %s views %s", found.length, viewsDir)

        var views = {}
        _.each( found, function(data, file) {
            try {
                var view = JSON.parse(data)
                view.id = view.id || path.basename(path.normalize(file), ".json");
                views[view.id] = view;
                console.log("UX: view: ", view.id);
            } catch(e) {
                console.error("Error:", file, e)
            }
        })
        return views
    },

    templates: function(templatesDir, feature) {
        assert(templatesDir, "Missing templatesDir");
	    var found  = files.find(templatesDir, self.accepts.html )
        console.log("UX: has %s templates %s", found.length, templatesDir)

	    var templates = {}

	    // add templates to recipe
	    var assetKey = "templates"
	    _.each( found, function(data, file) {
		    var id = file.substring(feature.paths[assetKey].length+1)
console.log("UX: template", id)

		    // strip repetitive whitespace
		    templates[assetKey+":"+id] = (""+data).replace(/\s+/g, ' ');
	    })
	    return templates;
    },

    scripts: function(scriptsDir, feature) {
        assert(scriptsDir, "Missing scriptsDir");
	    var found  = files.find(scriptsDir, self.accepts.ecma )
        console.log("UX: has %s scripts %s", found.length, scriptsDir)

		var scripts = {}

	    // add JS scripts to recipe
	    var assetKey = "scripts"
	    _.each( found, function(data, file) {
		    var id = file.substring(feature.paths[assetKey].length+1)
//console.log("UX: script", id)
		    scripts[assetKey+":"+id] = ""+data
	    })
	    return scripts
    }
}
