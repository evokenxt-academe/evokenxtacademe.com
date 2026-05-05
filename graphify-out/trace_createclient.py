import sys, json
import networkx as nx
from networkx.readwrite import json_graph
from pathlib import Path

# Load graph
data = json.loads(Path('graphify-out/graph.json').read_text())
G = json_graph.node_link_graph(data, edges='links')

question = 'How does createClient() link the Auth logic to almost every UI page?'
mode = 'bfs'
terms = ['createclient', 'auth', 'page', 'layout', 'server', 'client']

# Find start nodes
scored = []
for nid in G.nodes():
    label = G.nodes[nid].get('label', '').lower()
    score = sum(1 for t in terms if t in label)
    if score > 0:
        scored.append((score, nid))
scored.sort(reverse=True)
start_nodes = [nid for score, nid in scored[:3]]

subgraph_nodes = set(start_nodes)
subgraph_edges = []
frontier = set(start_nodes)

# BFS traversal
for _ in range(3):
    next_frontier = set()
    for n in frontier:
        for neighbor in G.neighbors(n):
            if neighbor not in subgraph_nodes:
                next_frontier.add(neighbor)
                subgraph_edges.append((n, neighbor))
    subgraph_nodes.update(next_frontier)
    frontier = next_frontier

# Output nodes and edges
ranked_nodes = sorted(subgraph_nodes, key=lambda nid: sum(1 for t in terms if t in G.nodes[nid].get('label', '').lower()), reverse=True)

print(f'Traversal: {mode.upper()} | Start: {[G.nodes[n].get("label",n) for n in start_nodes]} | {len(subgraph_nodes)} nodes')
for nid in ranked_nodes[:50]:
    d = G.nodes[nid]
    print(f'  NODE {d.get("label", nid)} [src={d.get("source_file","")} loc={d.get("source_location","")}]')
for u, v in subgraph_edges[:100]:
    d = G.edges[u, v]
    print(f'  EDGE {G.nodes[u].get("label",u)} --{d.get("relation","")} [{d.get("confidence","")}]--> {G.nodes[v].get("label",v)}')
