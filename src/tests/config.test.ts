import Config, { emptyConfig } from '../lib/config';

const tauriFsMock = {
  removeDir: jest.fn(),
  createDir: jest.fn().mockResolvedValue({}),
  removeFile: jest.fn(),
  readTextFile: jest.fn(),
  writeFile: jest.fn(),
};

describe('Config module', () => {
  const appName = 'random app name';
  const appDir = '/random-folder/';
  const params = {
    fs: tauriFsMock,
    appName,
    appDir,
    errorLogger: jest.fn(),
  };

  const configMock = {
    ...emptyConfig,
    plot: {
      location: `${appDir}${appName}`,
      sizeGB: 10,
    }
  };

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

    config.readConfigFile = jest.fn().mockResolvedValue(configMock);

    await config.init();

    expect(config.readConfigFile).toHaveBeenCalled();
  });

  it('init method should create directory and config file if there is none', async () => {
    const config = new Config(params);

    config.readConfigFile = jest.fn().mockRejectedValue(new Error);
    config['write'] = jest.fn().mockResolvedValue(null);

    await config.init();

    expect(tauriFsMock.createDir).toHaveBeenCalledWith(config['configDir']);
    expect(config['write']).toHaveBeenCalledWith(emptyConfig);
  });
});
