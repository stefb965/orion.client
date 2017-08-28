/*******************************************************************************
 * @license
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 /*eslint-env amd, browser, es6*/
define([
	"orion/Deferred",
	"js-yaml/js-yaml"
], function(Deferred, JsYaml) {

	/**
	 * @description This handler updates the 'env' map.
	 * @type {?}
	 * @since 14.0
	 */
	var envHandler = {
		id: "kubernetes.default.file.handler",
		/**
		 * @callback
		 */
		onCreated: function onCreated(project, qualifiedName, fileName) {
			//We can read the new files and update here, but that could take longer than 
			//would be ready for the next getComputedEnvironment call - just wipe the cache
			//and recompute when asked for
			if(project.importantChange(qualifiedName, fileName)) {
				//TODO update cache and force update maps
			}
		},
		/**
		 * @callback
		 */
		onDeleted: function onDeleted(project, qualifiedName, fileName) {
			//We don't have access to the deleted contents - wipe the cache and recompute
			if(importantChange(qualifiedName, fileName)) {
				//TODO wipe cached entries and force update
			}
		},
		/**
		 * @callback
		 */
		onModified: function onModified(project, qualifiedName, fileName) {
			project.updateNeeded = importantChange(qualifiedName, fileName);
		}
	};
	
	var initialized = false,
		map,
		fileClient,
		handlers,
		registry,
		projectMeta,
		projectPromise;

	/**
	 * @description Creates a new Kubernetes project
	 * @constructor
	 * @public
	 * @param {ServiceRegistry} serviceRegistry The service registry
	 */
	function KubernetesProject(serviceRegistry) {
		registry = serviceRegistry;
		handlers = new Map();
		this.addHandler(envHandler);
		fileClient = null;
	}
	
	/**
	 * @name JavaScriptProject.prototype.getFileClient
	 * @description Returns the file client to use
	 * @function
	 * @returns {orion.FileClient} The file client
	 */
	function getFileClient() {
		if(!fileClient) {
			fileClient = registry.getService("orion.core.file.client"); //$NON-NLS-1$
		}
		return fileClient;
	}
	
	/**
	 * @description Determines if the changed file is something we need to care about
	 * @param {string} qualifiedName The fully qualified name of the file
	 * @param {string} filename The short name of the file
	 * @returns {boolean} True if we need to react to the change, false otherwise
	 */
	function importantChange(qualifiedName, filename) {
		//TODO
		return false;
	}
	/**
	 * @description Computes the environment for a given project context
	 * @param {KubernetesProject} project The project to compute the environment for
	 */
	function computeEnvironment(project, update) {
		if(!update) {
			return new Deferred().resolve(project.map.env);
		}
		//TODO
		return new Deferred().resolve();
	}
	/**
	 * @name resolveProject
	 * @description Tries to find the project context based on where we are in the source tree
	 * @param {?} file The file object from the resource navigator
	 * @returns {?} The project context or null
	 */
	function resolveProject(file) {
		var deferred = new Deferred();
		if(file) {
            var floc = file.Location ? file.Location : file.location; 
			if(projectMeta && floc && floc.startsWith(projectMeta.Location)) {
				return deferred.resolve(projectMeta);
			}
			projectPromise = new Deferred();
			getFileClient().getProject(floc, {names: [/*TODO*/]}).then(function(project) {
				if(project) {
					return deferred.resolve({Location: project.Location});
				}
				return deferred.resolve(null);
			}, /* @callback */ function reject(err) {
				return deferred.resolve(null);
			});
		} else {
			return deferred.resolve(null);
		}
		return deferred;
	}
	/**
	 * @description Adds a handler for the given file name to the mapping of handlers.
	 * The handler object must have an 'id' property.
	 * @function
	 * @param {?} functions The object map of functions
	 */
	KubernetesProject.prototype.addHandler = function addHandler(handler) {
		handlers.set(handler.id, handler);
	};
	/**
	 * @description Removes a handler. The handler must have an 'id' property.	 
	 * @function
	 * @param {?} handler The handler to remove
	 */
	KubernetesProject.prototype.removeHandler = function removeHandler(handler) {
		if(handler.id && handlers.has(handler.id)) {
			handlers.delete(handler.id);
		}
	};
	/**
	 * @description Returns the current project path
	 * @function
	 * @returns {String} The current project path or null if there is no project context
	 */
	KubernetesProject.prototype.getProjectPath = function getProjectPath() {
		if(projectMeta) {
			return projectMeta.Location;
		}
		return null;
	};
	/**
	 * @description Fetch the named child of the current project context
	 * @function
	 * @param {String} childName The short name of the project child to get
	 * @param {String} projectPath The optional project path to fetch from
	 * @returns {Deferred} A deferred that will resolve to the requested child metadata or null
	 */
	KubernetesProject.prototype.getFile = function getFile(childName, projectPath) {
		if(!projectMeta && !projectPath) {
			return new Deferred().resolve(null);
		}
		var _project = projectMeta ? projectMeta.Location : projectPath;
		if (_project.lastIndexOf('/') !== _project.length-1){
			_project += '/';
		}
		var filePath = _project+childName;
		if(map.has(filePath)) {
			return new Deferred().resolve(map.get(filePath));
		}
		return getFileClient().read(filePath, false, false, {readIfExists: true}).then(function(child) {
			if(child !== null) {
				var data = {name: filePath, contents: child, project: _project};
	            map.set(filePath, data);
	            return data;
	        }
			return null;
		},
		function rejected() {
			return null;
		});
	};
	/**
	 * @description Fetch the children of the named child folder of the current project context
	 * @function
	 * @param {String} childName The short name of the project child to get
	 * @param {String} projectPath The optional project path to fetch from
	 * @returns {Deferred} A deferred that will resolve to the requested child metadata or null
	 */
	KubernetesProject.prototype.getFolder = function getFolder(childName, projectPath) {
		if(!projectMeta && !projectPath) {
			return new Deferred().resolve(null);
		}
		var _project = projectMeta ? projectMeta.Location : projectPath;
		if (_project.lastIndexOf('/') !== _project.length-1){
			_project += '/';
		}
		var folderPath = _project+childName;
		return getFileClient().fetchChildren(folderPath, {readIfExists: true}).then(function(children) {
            return children;
		},
		function rejected() {
			return [];
		});
	};
	/**
	 * @name KubernetesProject.prototype.initFrom
	 * @description Callback used to start the tooling from a non-plugin context - for example running the 'Show Problems'
	 * command on a folder prior to opening a JS file
	 * @function
	 * @param {String} path The file path that the tooling started from
	 * @returns {Deferred} A deferred to resolve once loading has completed
	 */
	KubernetesProject.prototype.initFrom = function initFrom(path) {
		if(!initialized) {
			//TODO	
		}	
	};
	/**
	 * @description Update the contents of the given file name, and optionally create the file if it does not exist.
	 * NOTE: this function does not check for existig values or duplicate entries, those checks must be done prior to calling
	 * this function with the JSON values to merge
	 * @function
	 * @param {String} childName The short name of the project child to get
	 * @param {Boolean} create If the file should be created if it does not exist
	 * @param {Object} values The object of values to mix-in to the current values for a file.
	 */
	KubernetesProject.prototype.updateFile = function updateFile(childName, create, values) {
		//TODO
	};
	/**
	 * @description Returns project-specific formatting options (if any)
	 * @function
	 * @returns {Deferred} A deferred that will resolve to the project-specific formatting options or null
	 */
	KubernetesProject.prototype.getFormattingOptions = function getFormattingOptions() {
		if(map.formatting) {
			return new Deferred().resolve(map.formatting);
		}
		return this.getFile(/*TODO*/).then(function(file) {
			if(file && file.contents) {
				return readAndMap(map, file, "formatting", this);
			}
			return null;
		}.bind(this));
	};
	/**
	 * @description Computes the environment that has been computed based on what config files are in the project
	 * @function
	 * @returns {Deferred} A deferred that will resolve to an object listing the computed environments to use in the tools
	 */
	KubernetesProject.prototype.getComputedEnvironment = function getComputedEnvironment() {
		//TODO
		return new Deferred().resolve();
//		if(!projectPromise) {
//			return new Deferred().reject("The project has not been initialized");
//		}
//		return projectPromise.then(function() {
//			if(this.updateNeeded) {
//				projectPromise = new Deferred();
//				this.updateNeeded = false;
//				return computeEnvironment(this, true).then(function() {
//					projectPromise.resolve();
//					return map.env;
//				});
//			}
//			return map.env;
//		}.bind(this));
	};
	

	/**
	 * @description Attempts to read the given file contents, parse it based on its type and cache it using the given key
	 * @param {?} map The project cache
	 * @param {?} file The file object from the file client
	 * @param {String} key The key to map to
	 * @param {JavaScriptProject} project The project context
	 * @returns {?} The parsed cache value
	 */
	function readAndMap(map, file, key, project) {
		map[key] = {file: file, vals: null};
		switch(file.name.slice(file.name.lastIndexOf('/')+1)) {
			case project.ESLINTRC:
			case project.ESLINTRC_JSON: {
				try {
					map[key].vals = JSON.parse(file.contents);
				} catch(err) {
					//ignore, bad JSON
				}
				break;
			}
			case project.PACKAGE_JSON: {
				try {
					var v = JSON.parse(file.contents);
					if(v && v.eslintConfig && typeof v.eslintConfig === "object") {
						map[key].vals = v.eslintConfig;
					}
				} catch(err) {
					//ignore, bad JSON
				}
				break;
			}
			case project.ESLINTRC_YAML:
			case project.ESLINTRC_YML: {
				try {
					map[key].vals = JsYaml.safeLoad(file.contents);
				} catch (e) {
					// ignore, bad YAML/YML
				}
				break;
			}
			case project.ESLINTRC_JS: {
				//TODO how should we load JS from an arbitrary file?
				//we can't eval them and we can't require them
				break;
			}
		}
		if (map[key].vals) {
			return map[key];
		}
		return null;
	}

	/**
	 * Callback from the orion.edit.model service
	 * @param {Object} evnt An <tt>orion.edit.model</tt> event.
	 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
	 */
	KubernetesProject.prototype.onInputChanged = function onInputChanged(evnt) {
		initialized = true;
		var file = evnt.file;
		return resolveProject.call(this, file).then(function(project) {
			if (project) {
				if(!this.projectMeta || project.Location !== this.projectMeta.Location) {
					this.projectMeta = project;
					delete this.map[this.TERN_PROJECT];
					return computeEnvironment(this, true).then(/* @callback */ function(env) {
							_handle.call(this, "onProjectChanged", this, evnt, project.Location);
							this.projectPromise.resolve(project);
						}.bind(this),
						/* @callback */ function(err) {
							_handle.call(this, "onProjectChanged", this, evnt, project.Location);
							this.projectPromise.resolve(project);
						}.bind(this));
				}
				return this.projectPromise.then(function() {
					_handle.call(this, "onInputChanged", this, evnt, project.Location);
				}.bind(this)); 
			}
			_handle.call(this, "onProjectChanged", this, evnt, null);
			this.projectPromise.resolve(null);
		}.bind(this));
	};

	/**
	 * Callback from the fileClient event listener
	 * @param {Object} evnt A file client Changed event.
	 */
	KubernetesProject.prototype.onFileChanged = function onFileChanged(evnt) {
		if(evnt && evnt.type === 'Changed') {
			_updateMap.call(this, evnt.modified, "onModified");
			_updateMap.call(this, evnt.deleted, "onDeleted");
			_updateMap.call(this, evnt.created, "onCreated");
			_updateMap.call(this, evnt.moved, "onMoved");
		}
	};
	/**
	 * Update the backing map
	 * @param {Array.<String>} arr The array to walk
	 * @param {String} state The state, one of: onModified, onDeleted, onCreated
	 */
	function _updateMap(arr, state) {
		if(Array.isArray(arr)) {
			arr.forEach(function(file) {
				var f, toQ, toN, n;
				switch(state) {
					case 'onCreated': {
						n = file.result ? file.result.Name : undefined;
						f = file.result ? file.result.Location : undefined;
						break;
					}
					case 'onDeleted': {
						f = file.deleteLocation;
						n = _shortName(file.deleteLocation);
						break;
					}
					case 'onModified': {
						n = _shortName(file);
						f = file;
						break;
					}
					case 'onMoved': {
						toQ = file.result ? file.result.Location : undefined;
						toN = file.result ? file.result.Name : undefined;
						n = _shortName(file.source);
						f = file.source;
						break;
					}
				}
				delete this.map[f];
				_handle.call(this, state, this, f, n, toQ, toN);
			}.bind(this));
		}
	}
	/**
	 * @description Returns the shortname of the file
	 * @param {String} fileName The fully qualified path of the file
	 * @returns {String} The last segment of the path (short name)
	 */
	function _shortName(fileName) {
		var i = fileName.lastIndexOf('/');
		if(i > -1) {
			return fileName.substr(i+1);
		}
		return fileName;
	}

	/**
	 * @description Delegates to a handler for the given handler name (file type), with the given function name
	 * @param {String} funcName The name of the function to call on the handler iff it exists
	 */
	function _handle(funcName) {
		if(Array.isArray(this.handlers)) {
			var args = Array.prototype.slice.call(arguments);
			this.handlers.forEach(function(handler) {
				var f = handler[funcName];
				if(typeof f === 'function') {
					f.apply(handler, args.slice(1));
				}
			});
		}
	}

	return KubernetesProject;
});