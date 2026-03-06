import * as v from 'valibot';

export const signInSchema = v.object({
	email: v.pipe(v.string(), v.email('Please enter a valid email')),
	_password: v.pipe(v.string(), v.minLength(8, 'Password must be at least 8 characters'))
});

export const signUpSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
	email: v.pipe(v.string(), v.email('Please enter a valid email')),
	_password: v.pipe(v.string(), v.minLength(8, 'Password must be at least 8 characters'))
});
