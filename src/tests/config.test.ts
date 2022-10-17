import Config, { emptyConfig } from '../lib/config';
import { configFileMock, configDir, appName, tauriInvokerMock } from '../mocks';
import TauriInvoker from '../lib/tauri';

const params = {
  appName,
  configDir,
  tauri: tauriInvokerMock,
};

// TODO:
// it will be nice to test with real files,
// but at the moment it does not work in testing environment.
// Investigate if there is way to make it work
describe('Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create instance', () => {
    const config = new Config(params);

    expect(config).toHaveProperty('init');
    expect(config).toHaveProperty('validate');
    expect(config).toHaveProperty('remove');
    expect(config).toHaveProperty('readConfigFile');
    expect(config).toHaveProperty('update');
  });

  it('init method should read config if there is one', async () => {
    const config = new Config(params);

    tauriInvokerMock.readConfig = jest.fn().mockResolvedValue(configFileMock);

    await config.init();

    expect(tauriInvokerMock.readConfig).toHaveBeenCalled();
  });

  it('init method should create directory and config file if there is none', async () => {
    const error = new Error('random error');
    const tauriInvoker = new TauriInvoker(jest.fn().mockResolvedValue({}));
    tauriInvoker.readConfig = jest.fn().mockRejectedValue(error);
    const config = new Config({ ...params, tauri: tauriInvoker });
    const createDirSpy = jest.spyOn(tauriInvoker, 'createDir');
    config['write'] = jest.fn().mockResolvedValue(null);

    await config.init();

    expect(tauriInvoker.readConfig).toHaveBeenCalled();
    expect(createDirSpy).toHaveBeenCalledWith(config['configPath']);
    expect(config['write']).toHaveBeenCalledWith(emptyConfig);
  });

  it('init method should throw error when failed to read config file and create config folder', async () => {
    const createFolderError = new Error('cannot create folder');
    const readConfigError = new Error('cannot read config');
    const tauriInvoker = new TauriInvoker(jest.fn().mockResolvedValue({}));
    tauriInvoker.createDir = jest.fn().mockRejectedValue(createFolderError);
    tauriInvoker.readConfig = jest.fn().mockRejectedValue(readConfigError);
    const config = new Config({ ...params, tauri: tauriInvoker });

    await expect(config.init()).rejects.toEqual(createFolderError);
  });

  it('validate method should return "true" if there is a valid config file', async () => {
    const config = new Config(params);

    config.readConfigFile = jest.fn().mockResolvedValue(configFileMock);

    const result = await config.validate();

    expect(config.readConfigFile).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('validate method should return "false" if config file is empty', async () => {
    const config = new Config(params);

    config.readConfigFile = jest.fn().mockResolvedValue(emptyConfig);

    const result = await config.validate();

    expect(config.readConfigFile).toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('remove method should remove config file using TauriInvoker method', async () => {
    const config = new Config(params);
    const removeFileSpy = jest.spyOn(tauriInvokerMock, 'removeConfig');
    await config.remove();

    expect(removeFileSpy).toHaveBeenCalled();
  });

  it('readConfigFile method should read config file and return it as an object', async () => {
    const tauriInvoker = new TauriInvoker(jest.fn().mockResolvedValue({}));
    tauriInvoker.readConfig = jest.fn().mockResolvedValue(JSON.stringify(configFileMock));
    const config = new Config({ ...params, tauri: tauriInvoker });
    const result = await config.readConfigFile();

    expect(tauriInvoker.readConfig).toHaveBeenCalled();
    expect(result).toEqual(configFileMock);
  });

  it('update method should update given property/properties in the config file', async () => {
    const newName = 'new node name';

    const tauriInvoker = new TauriInvoker(jest.fn().mockResolvedValue({}));
    tauriInvoker.readConfig = jest.fn().mockResolvedValue(JSON.stringify(configFileMock));
    const config = new Config({ ...params, tauri: tauriInvoker });

    config['write'] = jest.fn().mockResolvedValue(null);

    await config.update({ nodeName: newName });

    const expected = {
      ...configFileMock,
      nodeName: newName,
    };

    expect(config['write']).toHaveBeenCalledWith(expected);
  });
});
