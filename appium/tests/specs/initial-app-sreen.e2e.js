const { launchApp, setValue, getText, equal, setValueAndEnter } = require('../helpers');

describe('Verify initial app screen', () => {
	beforeEach(() => {
		launchApp();
	});

	it('set workspace url', async () => {
		await setValue('new-server-view-input', 'mobile');
		const value = await getText('new-server-view-input');
		equal(value, 'mobile');
	});

	it('set workspace url and login', async () => {
		await setValueAndEnter('new-server-view-input', 'mobile');
		const login = await getText('Login');
		equal(login, 'Login');
	});
});
