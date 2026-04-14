import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Agent } from './types';

interface OrgChartFlowProps {
  agents: Agent[];
  onManagerChange: (agentId: string, managerId: string | undefined) => void;
  onEditAgent: (agent: Agent) => void;
}

const CustomNode = ({ data }: { data: { agent: Agent, onEdit: (a: Agent) => void } }) => {
  return (
    <div className="window p-2 w-48 text-center bg-[#c0c0c0] flex flex-col gap-1 shadow-md border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-[#000080]" />
      <div className="flex flex-col items-center">
        <img src={data.agent.avatar} alt={data.agent.name} className="w-12 h-12 bg-white border border-black mb-1" style={{ imageRendering: 'pixelated' }} />
        <div className="font-bold text-sm truncate w-full">{data.agent.name}</div>
        <div className="text-xs text-[#000080] truncate w-full">{data.agent.role}</div>
      </div>
      <button
        className="btn-retro text-[10px] mt-1 py-0 px-1"
        onClick={() => data.onEdit(data.agent)}
      >
        EDIT
      </button>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-[#000080]" />
    </div>
  );
};

const nodeTypes = {
  customNode: CustomNode,
};

// A very basic layout algorithm since dagre/elk might be heavy
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  // Try to find levels
  const nodeLevels: Record<string, number> = {};

  const findLevel = (id: string, currentLevel: number = 0) => {
    if (nodeLevels[id] && nodeLevels[id] >= currentLevel) return;
    nodeLevels[id] = currentLevel;

    const children = edges.filter(e => e.source === id).map(e => e.target);
    children.forEach(childId => findLevel(childId, currentLevel + 1));
  };

  const roots = nodes.filter(n => !edges.some(e => e.target === n.id));
  roots.forEach(root => findLevel(root.id, 0));

  // Assign fallback levels for disconnected nodes
  nodes.forEach(n => {
    if (nodeLevels[n.id] === undefined) nodeLevels[n.id] = 0;
  });

  const levelCounts: Record<number, number> = {};

  const layoutedNodes = nodes.map((node) => {
    const level = nodeLevels[node.id];
    levelCounts[level] = (levelCounts[level] || 0) + 1;
    const xIndex = levelCounts[level] - 1;

    return {
      ...node,
      position: { x: xIndex * 220, y: level * 150 },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function OrgChartFlow({ agents, onManagerChange, onEditAgent }: OrgChartFlowProps) {
  const initialNodes: Node[] = useMemo(() => agents.map(agent => ({
    id: agent.id,
    type: 'customNode',
    data: { agent, onEdit: onEditAgent },
    position: { x: 0, y: 0 },
  })), [agents, onEditAgent]);

  const initialEdges: Edge[] = useMemo(() => agents
    .filter(a => a.managerId)
    .map(agent => ({
      id: `e-${agent.managerId}-${agent.id}`,
      source: agent.managerId!,
      target: agent.id,
      animated: true,
      style: { stroke: '#000080', strokeWidth: 2 }
    })), [agents]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const newNodes = agents.map(agent => {
      const existingNode = nodes.find(n => n.id === agent.id);
      return {
        id: agent.id,
        type: 'customNode',
        data: { agent, onEdit: onEditAgent },
        position: existingNode ? existingNode.position : { x: 0, y: 0 },
      };
    });

    const newEdges = agents
      .filter(a => a.managerId)
      .map(agent => ({
        id: `e-${agent.managerId}-${agent.id}`,
        source: agent.managerId!,
        target: agent.id,
        animated: true,
        style: { stroke: '#000080', strokeWidth: 2 }
      }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents]);

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source === connection.target) return;

    // Check for cycles
    let currentId = connection.source;
    let hasCycle = false;
    const visited = new Set<string>();

    while (currentId && !hasCycle) {
      if (currentId === connection.target) {
        hasCycle = true;
        break;
      }
      visited.add(currentId);
      const parentEdge = edges.find(e => e.target === currentId);
      if (parentEdge) {
        currentId = parentEdge.source;
        if (visited.has(currentId)) break; // Prevents infinite loop if cycle exists
      } else {
        break;
      }
    }

    if (hasCycle) {
      alert("Cannot create a circular management structure!");
      return;
    }

    // A node can only have one manager, so we remove any existing edge targeting this node
    setEdges((eds) => {
      const filtered = eds.filter((e) => e.target !== connection.target);
      return addEdge({ ...connection, animated: true }, filtered);
    });

    if (connection.target && connection.source) {
      onManagerChange(connection.target, connection.source);
    }
  }, [edges, onManagerChange, setEdges]);

  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    edgesToDelete.forEach(edge => {
      onManagerChange(edge.target, undefined);
    });
  }, [onManagerChange]);

  return (
    <div className="w-full h-[600px] border-2 border-black panel-inset bg-[#008080]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background color="#c0c0c0" gap={16} />
      </ReactFlow>
      <div className="absolute top-4 left-4 bg-white panel-inset p-2 text-xs font-bold shadow-md pointer-events-none">
        Drag from bottom circle to top circle to assign manager.
        <br />
        Select a line and press Backspace to remove manager.
      </div>
    </div>
  );
}
