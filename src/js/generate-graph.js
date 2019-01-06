import 'vis';
let vis = require('vis');

function getVertices(oldNodes) {
    return new vis.DataSet(oldNodes);
}

function getEdges(always, dit, dif) {
    return new vis.DataSet(always.concat(dit).concat(dif));
}

function createGraph(oldNodes, always, dit, dif){
    let container = document.getElementById('network');
    let data = {
        nodes: getVertices(oldNodes),
        edges: getEdges(always, dit, dif)
    };
    let options = {hierarchical: true};
    new vis.Network(container, data, options);
}

function consEdge(curEdge, label) {
    return {from: curEdge[0], to: curEdge[1], label: label, color: 'black', arrows: 'to', smooth: true};
}

function createEdgesFromLists(lists,label){
    let edges = [];
    for(let i = 0; i< lists.length; i++)
        edges.push(consEdge(lists[i], label));
    return edges;
}

function generate (curAns){
    let always = createEdgesFromLists(curAns.always, '');
    let dit = createEdgesFromLists(curAns.dit, 'T');
    let dif = createEdgesFromLists(curAns.dif, 'F');
    createGraph(curAns.nodes, always, dit, dif);
}

export {generate};