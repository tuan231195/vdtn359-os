import querystring from 'querystring';
import url from 'url';
import pick from 'lodash.pick';
import omitBy from 'lodash.omitby';

type KeyValueType = Record<string, string | string[] | null | undefined>;
class KeyValueFormat {
	private _valueMap: Record<string, string | string[]>;

	constructor(value: KeyValueType | string) {
		if (typeof value === 'string') {
			this.valueMap = querystring.parse(value);
		} else {
			this.valueMap = value || {};
		}
	}

	update(value: string | KeyValueType) {
		let parsedValue: any = value;
		if (typeof value === 'string') {
			parsedValue = querystring.parse(value);
		}
		this.valueMap = {
			...this._valueMap,
			...parsedValue,
		};
	}

	set valueMap(newValues) {
		this._valueMap = omitBy(newValues, (value) => value == undefined);
	}

	toString() {
		return querystring.stringify(this._valueMap);
	}

	toObject() {
		return this._valueMap;
	}
}

type URLInput = {
	protocol?: string | null;
	auth?: { username: string; password: string } | null;
	hostname?: string | null;
	port?: number | null;
	hash?: string | Record<string, string | string[] | undefined | null> | null;
	query?:
		| string
		| Record<string, string | string[] | undefined | null>
		| null;
	pathname?: string | null;
};

export class URLBuilder {
	protocol: string;
	auth: { username: string; password: string } | null;
	port: number | null;
	hostname: string | null;
	hash: KeyValueFormat;
	query: KeyValueFormat;
	pathname: string;

	constructor(inputURL: string | URLInput) {
		this.init(inputURL);
	}

	private init(inputURL: string | URLInput) {
		let parsedURL;
		if (typeof inputURL === 'string') {
			const urlObject = url.parse(inputURL);
			parsedURL = {
				...pick(urlObject, [
					'hostname',
					'query',
					'hash',
					'pathname',
					'protocol',
				]),
				auth: parseAuth(urlObject.auth),
				port: urlObject.port ? Number(urlObject.port) : null,
			};
		} else {
			parsedURL = inputURL;
		}
		this.hostname = parsedURL.hostname;
		this.port = parsedURL.port;
		this.setQuery(parsedURL.query);
		this.setHash(parsedURL.hash);
		this.auth = parsedURL.auth;
		this.protocol = parsedURL.protocol;
		this.pathname = parsedURL.pathname;
	}

	get host() {
		if (this.port) {
			return `${this.hostname || ''}:${this.port}`;
		} else {
			return this.hostname || '';
		}
	}

	get path() {
		let queryStr = this.query.toString();
		if (queryStr) {
			queryStr = `?${queryStr}`;
		}
		return `${this.pathname || ''}${queryStr}`;
	}

	get origin() {
		return url.format({
			hostname: this.hostname,
			port: this.port,
			protocol: this.protocol,
		});
	}

	get search() {
		return this.query ? `?${this.query.toString()}` : '';
	}

	clone() {
		return new URLBuilder(this.href);
	}

	set href(url: string) {
		this.init(url);
	}

	get href() {
		return url.format({
			search: this.query.toString(),
			hash: this.hash.toString(),
			hostname: this.hostname,
			pathname: this.pathname,
			port: this.port,
			auth: formatAuth(this.auth),
			protocol: this.protocol,
		});
	}

	setQuery(query: URLInput['query'] | KeyValueFormat) {
		if (typeof query === 'string') {
			query = query.replace(/^\?/, '');
		} else if (query instanceof KeyValueFormat) {
			query = query.toString();
		}
		this.query = new KeyValueFormat(query || '');
	}

	updateQuery(query: URLInput['query']) {
		if (!query) {
			return;
		}
		this.query.update(query);
	}

	updateHash(hash: URLInput['hash']) {
		if (!hash) {
			return;
		}
		this.hash.update(hash);
	}

	setHash(hash: URLInput['hash'] | KeyValueFormat) {
		if (typeof hash === 'string') {
			hash = hash.replace(/^#/, '');
		} else if (hash instanceof KeyValueFormat) {
			hash = hash.toString();
		}
		this.hash = new KeyValueFormat(hash || '');
	}

	toString() {
		return this.href;
	}
}

function parseAuth(authString) {
	if (!authString) {
		return null;
	}
	const parts = authString.split(':');
	return {
		username: parts[0],
		password: parts[1],
	};
}

function formatAuth(auth) {
	if (!auth) {
		return '';
	}
	return `${auth.username || ''}:${auth.password || ''}`;
}
