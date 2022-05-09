import axios from 'axios';
import axiosBetterStacktrace from 'axios-better-stacktrace';

axiosBetterStacktrace(axios);

const originalCreate = axios.create.bind(axios);
axios.create = (...args) => {
	const instance = originalCreate(...args);
	axiosBetterStacktrace(instance);
	return instance;
};
export { axios };
