import YAML from 'yaml';

export class CPipeline {
	constructor(
		readonly version: string = '2.1',
		readonly workflowVersion: string = '2'
	) {
		this.properties = {
			version: version,
			workflows: {
				version: workflowVersion,
			},
			jobs: {},
		};
	}
	private readonly properties: any;

	addWorkflow(workflow: CWorkflow) {
		this.properties.workflows[workflow.name] = workflow.toJson();
		return this;
	}

	addJob(job: CJob) {
		this.properties.jobs[job.name] = job.toJson();
		return this;
	}

	addOrb(name: string, version: string) {
		this.properties.orbs = this.properties.orbs || {};
		this.properties.orbs[name] = version;
	}

	toJson() {
		return this.properties;
	}
}

export class CWorkflow {
	private readonly properties: any = {
		jobs: [],
	};

	constructor(readonly name: string) {}

	prop(name: string, value: any) {
		this.properties[name] = value;
		return this;
	}

	addSingleLineJob(name: string) {
		this.properties.jobs.push(name);
		return this;
	}

	addMultilineJob(name: string, value: any) {
		this.properties.jobs.push({
			[name]: value,
		});
		return this;
	}

	toJson() {
		return this.properties;
	}
}

export class CJob {
	private readonly properties: any = {
		steps: [],
	};

	constructor(readonly name: string) {}

	prop(name: string, value: any) {
		this.properties[name] = value;
		return this;
	}

	addSinglelineStep(script: string) {
		this.properties.steps.push(script);
		return this;
	}

	addMultilineStep(script: string, value: any) {
		this.properties.steps.push({
			[script]: value,
		});
		return this;
	}

	toJson() {
		return this.properties;
	}
}

export function toYaml(pipeline: CPipeline) {
	return YAML.stringify(pipeline.toJson());
}
