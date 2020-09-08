import { URLBuilder } from '../index';

describe('URL', () => {
	describe('parse url', () => {
		it('should parse url correctly when all url parts are available', () => {
			const url = new URLBuilder(
				'https://user:pass@google.com:3000/path?a=1&b=2#c=3&d=4'
			);
			expect(url.auth).toEqual({
				username: 'user',
				password: 'pass',
			});
			expect(url.protocol).toEqual('https:');
			expect(url.hostname).toEqual('google.com');
			expect(url.host).toEqual('google.com:3000');
			expect(url.origin).toEqual('https://google.com:3000');
			expect(url.pathname).toEqual('/path');
			expect(url.path).toEqual('/path?a=1&b=2');
			expect(url.port).toEqual(3000);
			expect(url.query.toString()).toEqual('a=1&b=2');
			expect(url.hash.toString()).toEqual('c=3&d=4');
			expect(url.href).toEqual(
				'https://user:pass@google.com:3000/path?a=1&b=2#c=3&d=4'
			);
		});

		it('should handle missing parts', () => {
			const url = new URLBuilder('file:///path');
			expect(url.auth).toEqual(null);
			expect(url.path).toEqual('/path');
			expect(url.port).toEqual(null);
			expect(url.host).toEqual('');
			expect(url.origin).toEqual('file://');
			expect(url.href).toEqual('file:///path');
		});
	});

	describe('formatting', () => {
		it('should support basic url part update', () => {
			const url = new URLBuilder(
				'https://user:pass@google.com:3000/path?a=1&b=2#c=3&d=4'
			);
			url.hostname = 'example.com';
			url.pathname = '/newpath';
			url.protocol = 'http:';
			url.auth = {
				username: 'a',
				password: 'b',
			};
			expect(url.href).toEqual(
				'http://a:b@example.com:3000/newpath?a=1&b=2#c=3&d=4'
			);
			expect(url.toString()).toEqual(
				'http://a:b@example.com:3000/newpath?a=1&b=2#c=3&d=4'
			);
		});
	});

	describe('update query and hash', () => {
		it('should be able to completely replace hash and query', () => {
			const url = new URLBuilder(
				'https://user:pass@google.com:3000/path?a=1&b=2#c=3&d=4'
			);
			url.setQuery('c=3&d=4');
			url.setHash({
				a: '1',
				b: '2',
				unused: undefined,
			});
			expect(url.query.toString()).toEqual('c=3&d=4');
			expect(url.hash.toString()).toEqual('a=1&b=2');
			expect(url.href).toEqual(
				'https://user:pass@google.com:3000/path?c=3&d=4#a=1&b=2'
			);
		});

		it('should be able to do partial updates', () => {
			const url = new URLBuilder(
				'https://user:pass@google.com:3000/path?a=1&b=2#c=3&d=4'
			);
			url.updateHash('d=5');
			url.updateQuery({
				b: '3',
			});
			expect(url.query.toString()).toEqual('a=1&b=3');
			expect(url.hash.toString()).toEqual('c=3&d=5');
			expect(url.href).toEqual(
				'https://user:pass@google.com:3000/path?a=1&b=3#c=3&d=5'
			);
		});
	});
});
