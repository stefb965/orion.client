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
/*eslint-env amd, es6*/
define([
	'orion/Deferred'
], function(Deferred) {
	var registry,
		project,
		cache;

	/**
	 * Provides a shared AST.
	 * @name kubernetes.ASTManager
	 * @class Provides a shared AST.
	 * @param {?} serviceRegistry The platform service registry
	 * @param {?} kubeProject The backing project context
	 */
	function ASTManager(serviceRegistry, kubeProject) {
		cache = new Map();
		project = kubeProject;
		registry = serviceRegistry;
	}

	/**
	 * Returns the key to use when caching
	 * @param {Object|String} metadata The file infos
	 */
	function _getKey(metadata) {
		if(typeof metadata === 'string') {
			return metadata;
		}
		if(!metadata || !metadata.location) {
			return 'unknown'; //$NON-NLS-1$
		}
		return metadata.location;
	}

	/**
	 * @private
	 * @param {String} text The code to parse.
	 * @param {String} file The file name that we parsed
	 * @returns {Object} The AST.
	 */
	function parse(text, file, options) {
		var ast = null;
		return ast;
	}
	/**
	 * @param {orion.editor.EditorContext} editorContext
	 * @returns {orion.Promise} A promise resolving to the AST.
	 */
	ASTManager.prototype.getAST = function getAST(editorContext) {
		return editorContext.getFileMetadata().then(function(metadata) {
			var loc = _getKey(metadata);
			var ast = cache.get(loc);
			if (ast) {
				return new Deferred().resolve(ast);
			}
			return editorContext.getText().then(function(text) {
				var options = Object.create(null);
				if(project) {
					return project.getComputedEnvironment().then(function(env) {
						ast = parse(text, metadata ? metadata.location : 'unknown', {}); //$NON-NLS-1$
						cache.set(loc, ast);
						return ast;
					});
				}
				ast = parse(text, metadata ? metadata.location : 'unknown', options); //$NON-NLS-1$
				cache.set(loc, ast);
				return ast;
			});
		});
	};
	/**
	 * Callback from the orion.edit.model service
	 * @param {Object} event An <tt>orion.edit.model</tt> event.
	 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
	 */
	ASTManager.prototype.onModelChanging = function onModelChanging(evnt) {
		if(this.inputChanged) {
			//TODO haxxor, eat the first model changing event which immediately follows
			//input changed
			this.inputChanged = null;
		} else {
			cache.delete(_getKey(evnt.file));
		}
	};
	/**
	 * Callback from the orion.edit.model service
	 * @param {Object} event An <tt>orion.edit.model</tt> event.
	 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
	 */
	ASTManager.prototype.onInputChanged = function onInputChanged(evnt) {
		this.inputChanged = evnt;
	};
	/**
	 * Callback from the FileClient
	 * @param {Object} event a <tt>Changed</tt> event
	 */
	ASTManager.prototype.onFileChanged = function onFileChanged(evnt) {
		if(evnt && evnt.type === 'Changed' && Array.isArray(evnt.modified)) {
			evnt.modified.forEach(function(file) {
				if(typeof file === 'string') {
					cache.delete(_getKey(file));
				}
			});
		}
	};
	return ASTManager;
});
