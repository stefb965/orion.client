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
define([], function() {
	
	/**
	 * @description creates a new instance of the outliner
	 * @constructor
	 * @public
	 */
	function KubeOutliner() {
	}
	
	/**
	 * @description callback from the <code>orion.edit.outliner</code> service to create
	 * an outline
	 * @function
	 * @public
	 * @param {orion.edit.EditorContext} editorContext The editor context
	 * @param {?} options The options
	 * @returns {orion.Promise} to compute the outline
	 * @callback 
	 */
	KubeOutliner.prototype.computeOutline = function(editorContext, options) {
		return editorContext.getFileMetadata().then(function(meta) {
			return editorContext.getText().then(function(text) {
				return []; //TODO
			});
		});
	};
	
	return KubeOutliner;
});