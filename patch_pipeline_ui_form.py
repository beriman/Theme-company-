import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add UI to new task modal for pipeline
# Find: <div className="flex justify-end gap-3 lg:gap-4 mt-2 lg:mt-4">
form_buttons = """<div className="flex justify-end gap-3 lg:gap-4 mt-2 lg:mt-4">"""

pipeline_ui = """<div className="mt-2">
                  <label className="block text-lg lg:text-xl mb-1">Workflow Pipeline (Optional):</label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {newProjectForm.pipeline.map((agentId, idx) => {
                      const a = agents.find(ag => ag.id === agentId);
                      return (
                        <div key={idx} className="flex items-center gap-1 bg-[#000080] text-white px-2 py-1 text-sm border border-black">
                          <span>{idx + 1}. {a?.name || 'Unknown'}</span>
                          <button type="button" className="text-red-400 hover:text-red-200 font-bold ml-1" onClick={() => {
                            const newPipeline = [...newProjectForm.pipeline];
                            newPipeline.splice(idx, 1);
                            setNewProjectForm({...newProjectForm, pipeline: newPipeline});
                          }}>X</button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <select className="panel-inset flex-1 text-lg p-1" id="pipeline-add-select" defaultValue="">
                      <option value="" disabled>Add agent to pipeline...</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                    </select>
                    <button type="button" className="btn-retro text-sm px-2" onClick={() => {
                      const select = document.getElementById('pipeline-add-select') as HTMLSelectElement;
                      if (select.value) {
                        setNewProjectForm({...newProjectForm, pipeline: [...newProjectForm.pipeline, select.value]});
                        select.value = '';
                      }
                    }}>ADD</button>
                  </div>
                </div>
                """

content = content.replace(form_buttons, pipeline_ui + form_buttons)


# Also auto-start the next step in pipeline if Auto Tasker is not enabled (Auto Tasker will handle it otherwise)
# Auto Tasker is a feature, so let's modify Auto Tasker effect to prioritize pipeline tasks
auto_tasker_search = """// Auto-Tasker Logic
  useEffect(() => {
    if (!autoTaskerEnabled) return;

    const interval = setInterval(() => {
      const openTask = projects.find(p => p.status === 'open');
      if (!openTask) return;

      const idleAgent = agents.find(a => a.status === 'idle');
      if (!idleAgent) return;

      if (ops >= 20) {
        assignAgent(openTask.id, idleAgent.id);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [autoTaskerEnabled, projects, agents, ops]);"""

auto_tasker_replace = """// Auto-Tasker Logic
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Process pipelines
      const pipelineTask = projects.find(p => p.status === 'open' && p.pipeline && p.pipeline.length > (p.pipelineIndex || 0));
      if (pipelineTask && ops >= 20) {
        const nextAgentId = pipelineTask.pipeline![pipelineTask.pipelineIndex || 0];
        const nextAgent = agents.find(a => a.id === nextAgentId);
        if (nextAgent && nextAgent.status === 'idle') {
          assignAgent(pipelineTask.id, nextAgentId);
          return;
        }
      }

      // 2. Process Auto-Tasker
      if (!autoTaskerEnabled) return;
      const openTask = projects.find(p => p.status === 'open' && (!p.pipeline || p.pipeline.length === 0));
      if (!openTask) return;

      const idleAgent = agents.find(a => a.status === 'idle');
      if (!idleAgent) return;

      if (ops >= 20) {
        assignAgent(openTask.id, idleAgent.id);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [autoTaskerEnabled, projects, agents, ops, ownedUpgrades]);"""

content = content.replace(auto_tasker_search, auto_tasker_replace)

with open('src/App.tsx', 'w') as f:
    f.write(content)
