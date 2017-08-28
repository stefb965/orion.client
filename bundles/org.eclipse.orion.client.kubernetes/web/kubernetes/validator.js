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
/*eslint-env amd*/
define([
	"kubernetes/ruleData",
	"orion/i18nUtil",
	"i18n!kubernetes/nls/problems"
], function(Rules, i18nUtil, messages) {
	var config = {
		// 0:off, 1:warning, 2:error
		defaults: Rules.defaults,

		/**
		 * @description Sets the given rule to the given enabled value
		 * @function
		 * @private
		 * @param {String} ruleId The id of the rule to change
		 * @param {Number} value The value to set the rule to
		 * @param {Object} [key] Optional key to use for complex rule configuration.
		 */
		setOption: function(ruleId, value, key, index) {
			if (Array.isArray(this.rules[ruleId])) {
				var ruleConfig = this.rules[ruleId];
				var length = ruleConfig.length;
				var lastIndex = length - 1;
				if (index) {
					ruleConfig[index] = value;
				} else if (key) {
					ruleConfig[lastIndex] = ruleConfig[lastIndex] || {};
					ruleConfig[lastIndex][key] = value;
				} else {
					ruleConfig[0] = value;
				}
			} else {
				this.rules[ruleId] = value;
			}
		},

		/**
		 * @description Resets the rules to their default values
		 * @function
		 */
		setDefaults: function setDefaults() {
			this.rules = Object.create(null);
			var keys = Object.keys(this.defaults);
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
				var defaultValue = this.defaults[key];
				if (Array.isArray(defaultValue)) {
					var value = [];
					defaultValue.forEach(function(element) {
						if (typeof element === 'object') {
							var newElement = Object.create(null);
							Object.keys(element).forEach(function(key) {
								newElement[key] = element[key];
							});
							value.push(newElement);
						} else {
							value.push(element);
						}
					});
					this.rules[key] = value;
				} else {
					this.rules[key] = this.defaults[key];
				}
			}
		}
	};

	var registry,
		project;

	/**
	 * @description Creates a new KubeValidator
	 * @constructor
	 * @public
	 * @param {KubeProject} jsProject The backing JS project context
	 * @param {Object} serviceRegistry The platform service registry
	 * @returns {KubeValidator} Returns a new validator
	 */
	function KubeValidator(kubeProject, serviceRegistry) {
		project = kubeProject;
		config.setDefaults();
		registry = serviceRegistry;
	}

	/**
	 * @description Converts an eslint / esprima problem object to an Orion problem object
	 * @public
	 * @param {?} e Either a yaml error or a parse error.
	 * @returns {?} Orion problem objet
	 */
	function toProblem(e) {
		//TODO convert to platform problem
		return null;
	}

	/**
	 * @description Validates the given AST
	 * @function
	 * @private
	 * @param {?} meta The file metadata
	 * @param {string} text The given text
	 * @param {?} env An environment object to set in the config
	 * @param {?} config The configuration from the platform
	 * @returns {Array|Object} The array of problem objects
	 */
	function validate(meta, text, env, config) {
		//TODO
		return [];
	}
	/**
	 * @description Callback from SyntaxChecker API to perform any load-time initialization
	 * @function
	 * @param {String} loc The optional location the checker is initializing from
	 * @callback
	 */
	KubeValidator.prototype.initialize = function initialize(loc, contentType) {
		project.initFrom(loc);
	};
	/**
	 * @description Callback to create problems from orion.edit.validator
	 * @function
	 * @public
	 * @param {orion.edit.EditorContext} editorContext The editor context
	 * @param {Object} context The in-editor context (selection, offset, etc)
	 * @returns {orion.Promise} A promise to compute some problems
	 * @callback
	 */
	KubeValidator.prototype.computeProblems = function computeProblems(editorContext, context, config) {
		return editorContext.getFileMetadata().then(function(meta) {
			return editorContext.getText().then(function(text) {
				if (project) {
					project.getComputedEnvironment().then(function(cenv) {
						//TODO
						validate(meta, text, {}, {});
					});
				} else {
					// need to extract all scripts from the html text
					validate(meta, text, {}, config);
				}
			});
		});
	};

	/**
	 * @description Callback from orion.cm.managedservice
	 * @function
	 * @public
	 * @param {Object} properties The properties that have been changed
	 */
	KubeValidator.prototype.updated = function updated(properties) {
		if (!properties) {
			return;
		}
		var oldconfig = properties.pid === 'eslint.config';
		var keys = Object.keys(properties);
		var seen = Object.create(null);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var index = key.indexOf(':');
			var subKey = null;
			var realKey = key;
			var tabIndex = 0;
			if (index !== -1) {
				realKey = key.substring(0, index);
				subKey = key.substring(index + 1);
			} else {
				// check !
				index = key.indexOf('!');
				if (index !== -1) {
					realKey = key.substring(0, index);
					tabIndex = key.substring(index + 1);
				}
			}
			var ruleId = realKey;
			if (oldconfig && config.rules[realKey] !== config.defaults[realKey]) {
				//don't overwrite a new setting with an old one
				continue;
			}
			var legacy = this._legacy[ruleId];
			if (typeof legacy === 'string') {
				ruleId = legacy;
				if (seen[ruleId]) {
					//don't overwrite a new pref name with a legacy one
					continue;
				}
			}
			seen[ruleId] = true;
			var value = properties[key];
			if (subKey) {
				if (typeof value === 'string') {
					// split into an array
					var arr = value.split(',');
					if (arr && Array.isArray(arr)) {
						value = [];
						arr.forEach(function(element) {
							value.push(element.trim());
						});
					}
					config.setOption(ruleId, value, subKey);
				} else {
					config.setOption(ruleId, value, subKey);
				}
			} else if (tabIndex) {
				config.setOption(ruleId, value, null, tabIndex);
			} else {
				config.setOption(ruleId, value);
			}
		}
	};

	return KubeValidator;
});