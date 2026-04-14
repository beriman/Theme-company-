import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Update assignAgent logic for Pipeline continuation
assign_agent_completed = """const reward = Math.floor(50 * marketingLevel);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: 'completed', resultCode: code } : p));
      addLog(`Task [${project.title}] completed by ${agent.name}! (+${reward} Credits)`);
      setCredits(prev => prev + reward);
      addFloatingText(`+${reward} Credits!`);
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'idle' } : a));"""

assign_agent_completed_replace = """const reward = Math.floor(50 * marketingLevel);
      setCredits(prev => prev + reward);
      addFloatingText(`+${reward} Credits!`);

      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          const nextIndex = (p.pipelineIndex || 0) + 1;
          if (p.pipeline && p.pipeline.length > nextIndex) {
            addLog(`Task [${project.title}] completed by ${agent.name}! Moving to next agent in pipeline. (+${reward} Credits)`);
            return { ...p, status: 'open', resultCode: code, pipelineIndex: nextIndex, assignedAgentId: undefined, prompt: p.prompt + '\\n\\n[Previous Agent Code Output]:\\n' + code };
          } else {
            addLog(`Task [${project.title}] fully completed! (+${reward} Credits)`);
            return { ...p, status: 'completed', resultCode: code };
          }
        }
        return p;
      }));
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'idle' } : a));"""

content = content.replace(assign_agent_completed, assign_agent_completed_replace)


with open('src/App.tsx', 'w') as f:
    f.write(content)
