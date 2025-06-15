
import 'reflect-metadata';


beforeEach(() => {

  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {

  jest.restoreAllMocks();
});
