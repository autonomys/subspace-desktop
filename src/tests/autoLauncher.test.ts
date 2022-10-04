import { configClassMock, tauriFsMock } from '../mocks';
import AutoLauncher, { LinuxAutoLauncher } from '../lib/autoLauncher';

const appName = 'random app name';
const appPath = '/random-folder/';
const osAutoLauncherParams = {
  appName,
  appPath,
  fs: tauriFsMock,
  configDir: '/random-dir/'
};

const osAutoLauncher = new LinuxAutoLauncher(osAutoLauncherParams);
const params = {
  config: configClassMock,
  osAutoLauncher,
};

// TODO: these tests and current AutoLauncher implementation require more refactoring
// TODO: add test cases for MacOSAutoLauncher and WindowsAutoLauncher
describe('AutoLauncher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create instance', () => {
    const autoLauncher = new AutoLauncher(params);

    expect(autoLauncher).toHaveProperty('init');
    expect(autoLauncher).toHaveProperty('isEnabled');
    expect(autoLauncher).toHaveProperty('enable');
    expect(autoLauncher).toHaveProperty('disable');
  });

  it('isEnabled method should return "true" if auto launcher is enabled', async () => {
    const autoLauncher = new AutoLauncher(params);

    expect(autoLauncher['enabled']).toBe(false);

    const result = await autoLauncher.isEnabled();

    expect(autoLauncher['enabled']).toBe(true);
    expect(result).toBe(true); // configFileMock.launchOnBoot is true by default
  });

  it('isEnabled method should return "false" if auto launcher is disabled', async () => {
    const osAutoLauncher = new LinuxAutoLauncher(osAutoLauncherParams);

    osAutoLauncher.isEnabled = jest.fn().mockResolvedValue(false);

    const autoLauncher = new AutoLauncher({
      ...params,
      osAutoLauncher
    });

    const result = await autoLauncher.isEnabled();

    expect(result).toBe(false);
  });

  it('enable method should update "enabled" property and update config', async () => {
    const autoLauncher = new AutoLauncher(params);

    expect(autoLauncher['enabled']).toBe(false);

    await autoLauncher.enable();

    expect(autoLauncher['enabled']).toBe(true);
    expect(configClassMock.update).toHaveBeenCalledWith({ launchOnBoot: true });
  });

  it('enable method should throw error if osAutoLauncher throws error ', async () => {
    const error = new Error('OS autolauncher failed to enable');
    const osAutoLauncher = new LinuxAutoLauncher(osAutoLauncherParams);
    osAutoLauncher.enable = jest.fn().mockRejectedValue(error);

    const autoLauncher = new AutoLauncher({
      ...params,
      osAutoLauncher,
    });

    await expect(autoLauncher.enable()).rejects.toEqual(error);
  });

  it('disable method should update "enabled" property and update config', async () => {
    const osAutoLauncher = new LinuxAutoLauncher(osAutoLauncherParams);

    osAutoLauncher.disable = jest.fn().mockResolvedValue(null);

    const autoLauncher = new AutoLauncher({
      ...params,
      osAutoLauncher
    });
    
    await autoLauncher.enable();
    expect(autoLauncher['enabled']).toBe(true);

    osAutoLauncher.isEnabled = jest.fn().mockResolvedValue(false);

    await autoLauncher.disable();
    expect(autoLauncher['enabled']).toBe(false);
    expect(configClassMock.update).toHaveBeenCalledWith({ launchOnBoot: false });
  });

  it('disable method should throw error if osAutoLauncher throws error ', async () => {
    const error = new Error('OS autolauncher failed to disable');
    const osAutoLauncher = new LinuxAutoLauncher(osAutoLauncherParams);
    osAutoLauncher.disable = jest.fn().mockRejectedValue(error);

    const autoLauncher = new AutoLauncher({
      ...params,
      osAutoLauncher,
    });

    await expect(autoLauncher.disable()).rejects.toEqual(error);
  });
});
