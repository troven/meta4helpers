var self = module.exports = module.exports || {};

// =============================================================================
// framework packages

var fs         = require('fs');             // file system
var paths      = require('path');           // file paths
var mkdirp     = require('mkdirp')          // recursive directories
// =============================================================================

self.find  = function(home, accept, files) {

	files = files || {}

	var recurse = function(dir) {

        var found = fs.readdirSync(dir)

        found.forEach( function(file) {
            var path = paths.normalize(dir +"/"+ file)
            var stat = fs.statSync( path )

            if (stat.isDirectory() ) {
                recurse( path + "/")
            } else {
                var data = fs.readFileSync(path)
                if ( !accept || accept(path, data) ) {
                    files[path] = data
                }
            }
        })
        return files;
    }

    return recurse(home)
}

self.mkdirs = function (path) {
    if (!path) throw new Error("can't create empty dir")
    return mkdirp.sync(path)
}