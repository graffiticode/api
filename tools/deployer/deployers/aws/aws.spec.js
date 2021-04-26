import { buildGetIAM } from "./aws";

describe('aws', () => {
  it('getIAM', () => {
    const IAM = {};
    const getIAM = buildGetIAM({ IAM });
  });
});