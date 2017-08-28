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
/*eslint-env browser, amd*/
define([
	'orion/plugin',
	'orion/serviceregistry',
	'kubernetes/astManager',
	'kubernetes/kubeProject',
	'kubernetes/occurrences',
	'kubernetes/validator',
	'kubernetes/assist',
	'kubernetes/outliner',
	'kubernetes/hover',
	'i18n!kubernetes/nls/messages'
], function(PluginProvider, mServiceRegistry, AstManager, KubeProject, Occurrences, Validator, Assist, 
			Outliner, Hover, messages) {

	/**
	 * Plug-in headers
	 */
	var headers = {
		name: messages.pluginName,
		version: "1.0",
		description: messages.pluginDescription
	};
	var serviceRegistry = new mServiceRegistry.ServiceRegistry(),
		provider = new PluginProvider(headers, serviceRegistry),
		kubeProject = new KubeProject(serviceRegistry),
		astmanager = new AstManager(serviceRegistry, kubeProject);

	/**
	 * Register AST manager to know about changes
	 */
	provider.registerService("orion.edit.model", {
		onModelChanging: astmanager.onModelChanging.bind(astmanager),
		onInputChanged: astmanager.onInputChanged.bind(astmanager)
	}, {
		contentType: ["text/x-yaml"],
		types: ["ModelChanging", 'onInputChanged']
	});

	/**
	 * Register project to know about changes
	 */
	provider.registerService("orion.edit.model", {
		onInputChanged: kubeProject.onInputChanged.bind(kubeProject)
	}, {
		contentType: ["text/x-yaml"],
		types: ["ModelChanging", 'onInputChanged']
	});
	/**
	 * Register validators
	 */
	provider.registerService(["orion.edit.validator", "orion.cm.managedservice"], 
		new Validator(kubeProject, serviceRegistry),
		{
			contentType: ["text/x-yaml"],
			pid: 'kube.validator.config'
		}
	);

	/**
	 * Register content assist providers
	 */
	provider.registerService("orion.edit.contentassist", //$NON-NLS-1$
		new Assist(astmanager, kubeProject), 
		{
			name: messages.contentAssistDescription,
			id: "kubernetes.yaml.assist",
			contentType: ["text/x-yaml"] //$NON-NLS-1$
		}
	);

	/**
	 * Register occurrence providers
	 */
	provider.registerService("orion.edit.occurrences", //$NON-NLS-1$
		new Occurrences(), 
		{
			contentType: ["text/x-yaml"] //$NON-NLS-1$
		}
	);

	/**
	 * Register outliners
	 */
	provider.registerService("orion.edit.outliner", 
		new Outliner(),
		{
			id: "orion.kubernetes.yaml.outliner", //$NON-NLS-1$
			name: messages.outlinerName,
			contentType: ["text/x-yaml"] //$NON-NLS-1$
		});

	/**
	 * Register the hover support
	 */
	provider.registerService("orion.edit.hover", 
		new Hover(),
		{
			name: messages.kubeHover,
			contentType: ["text/x-yaml"] //$NON-NLS-1$
		});

	provider.connect(function() {
		var fc = serviceRegistry.getService("orion.core.file.client"); //$NON-NLS-1$
		fc.addEventListener("Changed", astmanager.onFileChanged.bind(astmanager));
		fc.addEventListener("Changed", kubeProject.onFileChanged.bind(kubeProject));
	});
});