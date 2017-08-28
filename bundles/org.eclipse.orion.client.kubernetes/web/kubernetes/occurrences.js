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
define([], function() {
	
	/**
	 * @name javascript.KubeOccurrences
	 * @description creates a new instance of the occurrence computer
	 * @constructor
	 * @public
	 */
	function KubeOccurrences() {
	}
	
	/**
	 * @name computeOccurrences
	 * @description Callback from the editor to compute the occurrences
	 * @function
	 * @public 
	 * @memberof javascript.JavaScriptOccurrences.prototype
	 * @param {?} editorContext The current editor context
	 * @param {?} ctxt The current selection context
	 */
	KubeOccurrences.prototype.computeOccurrences = function computeOccurrences(editorContext, ctxt) {
		return editorContext.getFileMetadata().then(function(meta) {
			return editorContext.getText().then(function(text) {
				var occurrences = [];
				//TODO
				return occurrences;
			});
		});
	};
	
	return KubeOccurrences;
});