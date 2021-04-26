import bent from 'bent';
import express from 'express';
import http from 'http';

import { buildCompile } from '../compile.js';

describe('compile', () => {
  it('should return language response', async () => {
    // Arrange
    const baseUrl = 'http://ltest.artcompiler.com';
    const getBaseUrlForLanguage = jest.fn().mockReturnValue(baseUrl);
    const res = 'response';
    const call = jest.fn().mockResolvedValue(res);
    const bent = jest.fn().mockReturnValue(call);
    const compile = buildCompile({ getBaseUrlForLanguage, bent });
    const lang = 'LTest';
    const req = 'request';

    // Act
    const actual = await compile(lang, req);

    // Assert
    expect(getBaseUrlForLanguage).toHaveBeenCalledWith(lang);
    expect(bent).toHaveBeenCalledWith(baseUrl, 'POST', 'json');
    expect(call).toHaveBeenCalledWith('/compile', req);
    expect(actual).toBe(res);
  });

  it('should throw error if call throws', async () => {
    // Arrange
    const baseUrl = 'http://ltest.artcompiler.com';
    const getBaseUrlForLanguage = jest.fn().mockReturnValue(baseUrl);
    const call = jest.fn().mockRejectedValue(new Error('failed to compile'));
    const bent = jest.fn().mockReturnValue(call);
    const compile = buildCompile({ getBaseUrlForLanguage, bent });
    const lang = 'LTest';
    const req = 'request';

    // Act
    await expect(compile(lang, req)).rejects.toThrow('failed to compile');

    // Assert
    expect(getBaseUrlForLanguage).toHaveBeenCalledWith(lang);
    expect(bent).toHaveBeenCalledWith(baseUrl, 'POST', 'json');
    expect(call).toHaveBeenCalledWith('/compile', req);
  });
});
