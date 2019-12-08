import buildGitGetter from './git';

describe('git', () => {
  it('noop', () => {
    buildGitGetter({});
  });
});