/*
 * Provides utilities to generate room ids and check their validity as well.
 * Uses nano id.
 */
import { nanoid } from 'nanoid';

const LENGTH = 2;

const generateId = () => {
	return nanoid(LENGTH);
};

const isValid = id => {
	const regex = new RegExp(`^[\\w\\d-_]{${LENGTH}}$`);

	return regex.test(id);
};

export default { generateId, isValid };
export { generateId, isValid }
