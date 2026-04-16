import React, { useMemo, useCallback } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Agent } from './types';

interface WorkflowFlowProps {
  agents: Agent[];
  workflow: string[]; // array of agent IDs
  onWorkflowChange: (newWorkflow: string[]) => void;
}

const WorkflowNode = ({ data }: { data: { agent: Agent } }) => {
  return (
    <div className="window p-2 w-48 text-center bg-[#c0c0c0] flex flex-col gap-1 shadow-md border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-[#000080]" />
      <div className="flex flex-col items-center">
        <img src={data.agent.avatar} alt={data.agent.name} className="w-12 h-12 bg-white border border-black mb-1" style={{ imageRendering: 'pixelated' }} />
        <div className="font-bold text-sm truncate w-full">{data.agent.name}</div>
        <div className="text-xs text-[#000080] truncate w-full">{data.agent.role}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-[#000080]" />
    </div>
  );
};

const nodeTypes = {
  workflowNode: WorkflowNode,
};

export default function WorkflowFlow({ agents, workflow, onWorkflowChange }: WorkflowFlowProps) {
  // Only show agents in the current workflow in the flow diagram, positioned linearly
  const initialNodes: Node[] = useMemo(() => {
    return workflow.map((agentId, index) => {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return null;
      return {
        id: `wf-${agentId}-${index}`, // Unique ID allowing duplicates if needed
        type: 'workflowNode',
        data: { agent },
        position: { x: index * 250, y: 100 },
      };
    }).filter(Boolean) as Node[];
  }, [workflow, agents]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    for (let i = 0; i < workflow.length - 1; i++) {
      edges.push({
        id: `e-wf-${i}-${i+1}`,
        source: `wf-${workflow[i]}-${i}`,
        target: `wf-${workflow[i+1]}-${i+1}`,
        animated: true,
        style: { stroke: '#ff0000', strokeWidth: 3 }
      });
    }
    return edges;
  }, [workflow]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when workflow prop changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle adding an agent to the end of the workflow
  const addAgentToWorkflow = (agentId: string) => {
    onWorkflowChange([...workflow, agentId]);
  };

  const removeLastAgent = () => {
    if (workflow.length > 0) {
      onWorkflowChange(workflow.slice(0, -1));
    }
  };

  const clearWorkflow = () => {
      onWorkflowChange([]);
  }

  // Load predefined template
  const loadTemplate = (templateIds: string[]) => {
      // Find matching agents by role
      const newWorkflow: string[] = [];
      for (const role of templateIds) {
          const matchingAgent = agents.find(a => a.role === role);
          if (matchingAgent) {
              newWorkflow.push(matchingAgent.id);
          }
      }
      onWorkflowChange(newWorkflow);
  };

  return (
    <div className="flex flex-col h-full gap-2">
        <div className="panel-inset bg-white p-2 flex flex-wrap gap-2 items-center">
            <span className="font-bold text-sm text-[#000080]">Templates:</span>
            <button className="btn-retro py-0 px-2 text-xs" onClick={() => loadTemplate(['Architect', 'Scrum Master', 'Developer', 'QA'])}>BMad Agile</button>
            <button className="btn-retro py-0 px-2 text-xs" onClick={() => loadTemplate(['Product Manager', 'UX Designer', 'Frontend'])}>Product Flow</button>
            <button className="btn-retro py-0 px-2 text-xs" onClick={() => loadTemplate(['Fullstack'])}>Solo Quick Dev</button>
            <button className="btn-retro py-0 px-2 text-xs" onClick={clearWorkflow}>Clear</button>
        </div>

        <div className="flex-1 w-full border-2 border-black panel-inset bg-[#008080] relative">
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
        >
            <Controls />
            <Background color="#c0c0c0" gap={16} />
        </ReactFlow>
        </div>

        <div className="panel-inset bg-white p-2">
            <div className="font-bold mb-1 text-sm">Add Agent to Pipeline:</div>
            <div className="flex overflow-x-auto gap-2 pb-2">
                {agents.map(agent => (
                    <div
                        key={agent.id}
                        className="window p-1 min-w-[120px] cursor-pointer hover:bg-gray-200 flex items-center gap-2"
                        onClick={() => addAgentToWorkflow(agent.id)}
                    >
                        <img src={agent.avatar} alt={agent.name} className="w-8 h-8 border border-black" />
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-bold text-[10px] truncate">{agent.name}</span>
                            <span className="text-[9px] text-[#000080] truncate">{agent.role}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-2">
                <button className="btn-retro py-1 px-2 text-xs bg-red-200" onClick={removeLastAgent}>Remove Last Step</button>
            </div>
        </div>
    </div>
  );
}
