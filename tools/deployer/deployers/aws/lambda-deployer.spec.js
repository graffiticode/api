import {
  buildMakeUpdateApiConfigurationCallback,
  buildLambdaDeployer,
} from './lambda-deployer';

function createAwsFunction(value) {
  return jest.fn().mockReturnValue({ promise: () => Promise.resolve(value) });
}

describe('aws', () => {
  describe('lambdaDeployer', () => {
    it('smoke', async () => {
      // Arrange
      const cancel = jest.fn().mockReturnValue();
      const updateText = jest.fn().mockReturnValue();
      const displayTextWithSpinner = jest.fn().mockReturnValue({ cancel, updateText });
      const zip = jest.fn().mockResolvedValue();
      const updateCode = jest.fn().mockImplementation(() => {
        project.context.lambda = {
          Configuration: {
            FunctionArn: 'FunctionArn',
            FunctionName: 'FunctionName',
          }
        };
        return Promise.resolve();
      });
      const updateApiGateway = jest.fn().mockImplementation(() => {
        project.context.api = {
          ApiEndpoint: 'http://foo.ex.com',
        };
        return Promise.resolve();
      });
      const makeUpdateApiConfigurationCallback = jest.fn().mockReturnValue('callback');
      const project = {
        name: 'foo',
        config: {
          deploy: {}
        },
        context: {
          config: {},
          callbacks: [],
        },
      };
      const lambdaDeployer = buildLambdaDeployer({
        displayTextWithSpinner,
        zip,
        updateCode,
        updateApiGateway,
        makeUpdateApiConfigurationCallback
      });

      // Act
      await expect(lambdaDeployer(project)).resolves.toBe();

      // Assert
      expect(project).toHaveProperty('context.url', 'http://foo.ex.com');
      expect(project.context.callbacks).toHaveLength(0);
    });
    it('should add callback if an api project', async () => {
      // Arrange
      const cancel = jest.fn().mockReturnValue();
      const updateText = jest.fn().mockReturnValue();
      const displayTextWithSpinner = jest.fn().mockReturnValue({ cancel, updateText });
      const zip = jest.fn().mockResolvedValue();
      const updateCode = jest.fn().mockImplementation(() => {
        project.context.lambda = {
          Configuration: {
            FunctionArn: 'FunctionArn',
            FunctionName: 'FunctionName',
          }
        };
        return Promise.resolve();
      });
      const updateApiGateway = jest.fn().mockImplementation(() => {
        project.context.api = {
          ApiEndpoint: 'http://foo.ex.com',
        };
        return Promise.resolve();
      });
      const makeUpdateApiConfigurationCallback = jest.fn().mockReturnValue('callback');
      const project = {
        name: 'foo',
        config: {
          type: 'api',
          deploy: {}
        },
        context: {
          config: {},
          callbacks: [],
        },
      };
      const lambdaDeployer = buildLambdaDeployer({
        displayTextWithSpinner,
        zip,
        updateCode,
        updateApiGateway,
        makeUpdateApiConfigurationCallback
      });

      // Act
      await expect(lambdaDeployer(project)).resolves.toBe();

      // Assert
      expect(project).toHaveProperty('context.url', 'http://foo.ex.com');
      expect(makeUpdateApiConfigurationCallback).toHaveBeenCalledWith(project);
      expect(project.context.callbacks).toHaveLength(1);
      expect(project).toHaveProperty('context.callbacks.0', 'callback');
    });
  });
  describe('makeUpdateApiConfigurationCallback', () => {
    it('smoke', async () => {
      // Arrange
      const apiProject = {
        name: 'api',
        config: {
          type: 'api'
        },
        context: {
          buildPath: '/tmp/build',
          zipfilePath: '/tmp/build/function.zip',
          lambda: {
            Configuration: {
              FunctionName: 'FunctionName'
            }
          }
        }
      }
      const parseURL = jest.fn().mockReturnValue({ protocol: 'https:', host: 'one.ex.com', port: '' });
      const writeFile = jest.fn().mockResolvedValue();
      const unlink = jest.fn().mockResolvedValue();
      const zip = jest.fn().mockResolvedValue();
      const readFile = jest.fn().mockResolvedValue('<zip-file-contents>');
      const lambda = {
        updateFunctionCode: createAwsFunction(),
        updateFunctionConfiguration: createAwsFunction(),
      };
      const getLambda = jest.fn().mockReturnValue(lambda);
      const makeUpdateApiConfigurationCallback = buildMakeUpdateApiConfigurationCallback({
        parseURL,
        writeFile,
        unlink,
        zip,
        readFile,
        getLambda
      });
      const updateApiConfigurationCallback = makeUpdateApiConfigurationCallback(apiProject);
      const projects = [
        apiProject,
        {
          name: 'one',
          config: {},
          context: { url: 'https://one.ex.com' }
        }
      ];

      // Act
      await expect(updateApiConfigurationCallback({ projects })).resolves.toBe();

      // Assert
      expect(writeFile).toHaveBeenCalledWith('/tmp/build/build/configs/lambda-config.json', '{"hosts":{"one":"one.ex.com"},"ports":{"one":"443"},"protocol":"https","unused":true}');
      expect(unlink).toHaveBeenCalledWith('/tmp/build/function.zip');
      expect(zip).toHaveBeenCalledWith(apiProject);
      expect(lambda.updateFunctionCode).toHaveBeenCalledTimes(1);
      expect(lambda.updateFunctionConfiguration).toHaveBeenCalledTimes(1);
    });
    it('should use port if exists', async () => {
      // Arrange
      const apiProject = {
        name: 'api',
        config: {
          type: 'api'
        },
        context: {
          buildPath: '/tmp/build',
          zipfilePath: '/tmp/build/function.zip',
          lambda: {
            Configuration: {
              FunctionName: 'FunctionName'
            }
          }
        }
      }
      const parseURL = jest.fn().mockReturnValue({ protocol: 'https:', host: 'one.ex.com', port: '9000' });
      const writeFile = jest.fn().mockResolvedValue();
      const unlink = jest.fn().mockResolvedValue();
      const zip = jest.fn().mockResolvedValue();
      const readFile = jest.fn().mockResolvedValue('<zip-file-contents>');
      const lambda = {
        updateFunctionCode: createAwsFunction(),
        updateFunctionConfiguration: createAwsFunction(),
      };
      const getLambda = jest.fn().mockReturnValue(lambda);
      const makeUpdateApiConfigurationCallback = buildMakeUpdateApiConfigurationCallback({
        parseURL,
        writeFile,
        unlink,
        zip,
        readFile,
        getLambda
      });
      const updateApiConfigurationCallback = makeUpdateApiConfigurationCallback(apiProject);
      const projects = [
        apiProject,
        {
          name: 'one',
          config: {},
          context: { url: 'https://one.ex.com' }
        }
      ];

      // Act
      await expect(updateApiConfigurationCallback({ projects })).resolves.toBe();

      // Assert
      expect(writeFile).toHaveBeenCalledWith('/tmp/build/build/configs/lambda-config.json', '{"hosts":{"one":"one.ex.com"},"ports":{"one":"9000"},"protocol":"https","unused":true}');
      expect(unlink).toHaveBeenCalledWith('/tmp/build/function.zip');
      expect(zip).toHaveBeenCalledWith(apiProject);
      expect(lambda.updateFunctionCode).toHaveBeenCalledTimes(1);
      expect(lambda.updateFunctionConfiguration).toHaveBeenCalledTimes(1);
    });
    it('should set port to 80 if protocol is http', async () => {
      // Arrange
      const apiProject = {
        name: 'api',
        config: {
          type: 'api'
        },
        context: {
          buildPath: '/tmp/build',
          zipfilePath: '/tmp/build/function.zip',
          lambda: {
            Configuration: {
              FunctionName: 'FunctionName'
            }
          }
        }
      }
      const parseURL = jest.fn().mockReturnValue({ protocol: 'http:', host: 'one.ex.com', port: '' });
      const writeFile = jest.fn().mockResolvedValue();
      const unlink = jest.fn().mockResolvedValue();
      const zip = jest.fn().mockResolvedValue();
      const readFile = jest.fn().mockResolvedValue('<zip-file-contents>');
      const lambda = {
        updateFunctionCode: createAwsFunction(),
        updateFunctionConfiguration: createAwsFunction(),
      };
      const getLambda = jest.fn().mockReturnValue(lambda);
      const makeUpdateApiConfigurationCallback = buildMakeUpdateApiConfigurationCallback({
        parseURL,
        writeFile,
        unlink,
        zip,
        readFile,
        getLambda
      });
      const updateApiConfigurationCallback = makeUpdateApiConfigurationCallback(apiProject);
      const projects = [
        apiProject,
        {
          name: 'one',
          config: {},
          context: { url: 'https://one.ex.com' }
        }
      ];

      // Act
      await expect(updateApiConfigurationCallback({ projects })).resolves.toBe();

      // Assert
      expect(writeFile).toHaveBeenCalledWith('/tmp/build/build/configs/lambda-config.json', '{"hosts":{"one":"one.ex.com"},"ports":{"one":"80"},"protocol":"https","unused":true}');
      expect(unlink).toHaveBeenCalledWith('/tmp/build/function.zip');
      expect(zip).toHaveBeenCalledWith(apiProject);
      expect(lambda.updateFunctionCode).toHaveBeenCalledTimes(1);
      expect(lambda.updateFunctionConfiguration).toHaveBeenCalledTimes(1);
    });
  });
});