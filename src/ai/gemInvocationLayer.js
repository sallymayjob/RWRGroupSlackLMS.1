/** LMS-055 Gem invocation layer */

function createGemInvocationLayer({ geminiService, gemRolesRepo, promptConfigsRepo }) {
  async function invokeRole(roleName, taskPayload) {
    const role = gemRolesRepo.getByRoleName(roleName);
    if (!role) throw new Error(`Unknown gem role: ${roleName}`);

    const promptConfig = promptConfigsRepo.getActiveByRoleName(roleName);
    if (!promptConfig) throw new Error(`No active prompt config for role: ${roleName}`);

    const prompt = `${promptConfig.system_prompt}\n\nINPUT:\n${JSON.stringify(taskPayload)}`;
    const output = await geminiService.generate({
      prompt,
      metadata: {
        roleName,
        gemIdentifier: role.gem_identifier,
        promptId: promptConfig.prompt_id,
      },
    });

    return {
      roleName,
      promptId: promptConfig.prompt_id,
      gemIdentifier: role.gem_identifier,
      output,
    };
  }

  return { invokeRole };
}

module.exports = { createGemInvocationLayer };
