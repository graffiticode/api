export default function buildGetRole({ getIAM }) {
  return async function getRole({ context, RoleName, AssumeRolePolicyDocument, PolicyArn }) {
    const iam = getIAM({ context });
    try {
      const Tags = [{ Key: 'graffiticode', Value: '' }];
      const { Role } = await iam.createRole({ RoleName, AssumeRolePolicyDocument, Tags }).promise();
      await iam.attachRolePolicy({ RoleName, PolicyArn }).promise();
      return Role;
    } catch (err) {
      if (err.code !== 'EntityAlreadyExists') {
        throw err;
      }
      const { Role } = await iam.getRole({ RoleName }).promise();
      return Role;
    }
  };
}
