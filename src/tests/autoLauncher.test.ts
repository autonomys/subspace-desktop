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

const osSpecificAutoLauncher = new LinuxAutoLauncher(osAutoLauncherParams);
const params = {
  config: configClassMock,
  osSpecificAutoLauncher,
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
    const osSpecificAutoLauncher = new LinuxAutoLauncher(osAutoLauncherParams);

    osSpecificAutoLauncher.isEnabled = jest.fn().mockResolvedValue(false);

    const autoLauncher = new AutoLauncher({
      ...params,
      osSpecificAutoLauncher
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

  it('disable method should update "enabled" property and update config', async () => {
    const osSpecificAutoLauncher = new LinuxAutoLauncher(osAutoLauncherParams);

    osSpecificAutoLauncher.disable = jest.fn().mockResolvedValue(null);
    
    const autoLauncher = new AutoLauncher({
      ...params,
      osSpecificAutoLauncher
    });
    
    await autoLauncher.enable();
    expect(autoLauncher['enabled']).toBe(true);
    
    osSpecificAutoLauncher.isEnabled = jest.fn().mockResolvedValue(false);

    await autoLauncher.disable();
    expect(autoLauncher['enabled']).toBe(false);
    expect(configClassMock.update).toHaveBeenCalledWith({ launchOnBoot: false });
  });
});
