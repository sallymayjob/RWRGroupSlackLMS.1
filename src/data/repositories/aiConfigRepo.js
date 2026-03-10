/** AI config repository for Gem_Roles and Prompt_Configs */

function createAiConfigRepo(dal) {
  return {
    upsertGemRole(role) {
      return dal.upsert('Gem_Roles', role, (row) => row.gem_role_id === role.gem_role_id);
    },
    getByRoleName(roleName) {
      return dal.getOne('Gem_Roles', (row) => row.role_name === roleName && row.active_flag === 'true');
    },
    upsertPromptConfig(prompt) {
      return dal.upsert('Prompt_Configs', prompt, (row) => row.prompt_id === prompt.prompt_id);
    },
    getActiveByRoleName(roleName) {
      return dal.getOne('Prompt_Configs', (row) => row.role_name === roleName && row.active_flag === 'true');
    },
  };
}

module.exports = { createAiConfigRepo };
