/*******************************************************************************
 * @license
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - Allow original requirejs plugin to find files in Orion workspace
 *******************************************************************************/
define([
	'orion/editor/templates',
	'kubernetes/util',
	'orion/i18nUtil',
	'i18n!kubernetes/nls/messages'
], function(mTemplates, Util, i18nUtil, Messages) {

	var versions = {
		type: "link",
		values: [
			"v1",
			"v1beta1",
			"v2",
			"v2alpha1",
			"v3"
		],
		title: Messages.versionValues,
		style: 'emphasis' //$NON-NLS-1$
	};

	var booleans = {
		type: "link",
		values: [
			"true",
			"false"
		],
		title: Messages.booleanValues,
		style: 'emphasis'
	};
//Roll up similar templates into one with vars
	var topLevelTemplates = [{
		prefix: "daemonset",
		name: Messages.daemonSetTemplateName,
		nodes: {
			top: true
		},
		template: String("apiVersion: ${type:" + JSON.stringify(versions).replace("}", "\\}") + "}\nkind: DaemonSet")
					.concat("\nmetadata:\n  name: ${name}\nspec: +DaemonSpec\nstatus: +DaemonStatus"),
		url: "https://kubernetes.io/docs/api-reference/v1.7/#daemonset-v1beta1-extensions",
		doc: Messages.daemonSetTemplateDescription
	}, {
		prefix: "deployment",
		name: Messages.deploymentTemplateName,
		nodes: {
			top: true
		},
		template: String("apiVersion: ${type:" + JSON.stringify(versions).replace("}", "\\}") + "}\nkind: DaemonSet")
					.concat("\nmetadata:\n  name: ${name}\nspec: +DeployentSpec\nstatus: +DeploymentStatus"),
		url: "https://kubernetes.io/docs/api-reference/v1.7/#deployment-v1beta1-apps",
		doc: Messages.deploymentTemplateDescription
	}, {
		prefix: "cronjob",
		name: Messages.cronJobTemplateName,
		nodes: {
			cronlist: true
		},
		template: String("apiVersion: ${type:" + JSON.stringify(versions).replace("}", "\\}") + "}\nkind: \"\"\nmetadata: +ObjectMeta")
					.concat("\nspec: +CronJobSpec\nstatus: +CronJobStatus"),
		url: "https://kubernetes.io/docs/api-reference/v1.7/#cronjob-v2alpha1-batch",
		doc: Messages.cronJobTemplateDescription
	}, 
	{
		prefix: "container",
		name: Messages.containerTemplateName,
		nodes: {
			pod: true
		},
		template: String("Container:\n  args: []\n  command: []\n  env: [+EnvVar]\n  envFrom: [+EnvFromSource]\n  image: \"\"")
			.concat("\n  imagePullPolicy: \"\"\n  lifecycle: +Lifecycle\n  livenessProbe: +Probe\n  name: \"${name}\"")
			.concat("\n  ports: [+ContainerPort]\n  readinessProbe: +Probe\n  resources: +ResourceRequirements")
			.concat("\n  securityContext: +SecurityContext\n  stdin: ${type:" + JSON.stringify(booleans).replace("}", "\\}") + "}")
			.concat("\n  stdinOnce: ${type:" + JSON.stringify(booleans).replace("}", "\\}") + "}\n  terminationMessagePath: \"\"")
			.concat("\n  terminationMessagePolicy : \"\"\n  tty: ${type:" + JSON.stringify(booleans).replace("}", "\\}") + "}")
			.concat("\n  volumeMounts: [+VolumeMount]\n  workingDir: \"\""),
		url: "https://kubernetes.io/docs/api-reference/v1.7/#container-v1-core",
		doc: Messages.containerTemplateDescription
	}];


	function makeTemplateProposal(params, template) {
		var namePrefix = params.prefix ? params.prefix : "";
		if (Util.looselyMatches(namePrefix, template.prefix)) {
			var t = new mTemplates.Template(template.prefix, template.description, template.template);
			var prop = t.getProposal(params.prefix, params.offset, params);
			prop.name = template.name;
			prop.prefix = params.prefix;
			prop.overwrite = true;
			prop.style = 'emphasis'; //$NON-NLS-1$
			prop.kind = 'kube'; //$NON-NLS-1$
			prop.tags = [{
				cssClass: "iconTemplate"
			}];
			if (template.doc || template.url) {
				var hover = Object.create(null);
				hover.type = 'markdown'; //$NON-NLS-1$
				hover.content = "";
				if (template.doc) {
					hover.content += template.doc;
				}
				hover.content += "\n\nTESTING\nThis template belongs to the '"+Object.keys(template.nodes).join(", ")+"' node types";
				if (template.url) {
					hover.content += i18nUtil.formatMessage(Messages.onlineDocumentation, template.url);
				}
				prop.hover = hover;
			}
			return prop;
		}
	}

	/**
	 * @description Fetch all the templates that apply to the given context
	 * @param {?} context The templating context. Must contain a prefix (or empty string) and a file offset
	 */
	function getTemplatesFor(context) {
		if (context) { //TODO hack for testing
			var tmplates = [];
			topLevelTemplates.forEach(function(t) {
				tmplates.push(makeTemplateProposal(context, t));
			});
			return tmplates;
		}
	}
	return {
		getTemplatesFor: getTemplatesFor
	};
});