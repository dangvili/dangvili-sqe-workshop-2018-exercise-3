import * as esprima from 'esprima';

const escodegen = require('escodegen');

import {symbolicSubstitution, substituteFromParsed} from './symbolic-substitution';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse, {loc: true});
};

let greenColor = 'lime';
let normalShape = 'box';
let roundedShape = 'ellipse';
let rhombusShape = 'diamond';

function getBody(codeToCFG, inputVector) {
    return paintTreeWVector(codeToCFG, inputVector)[0].body[0].body.body;
}

/**
 * returns a tuple of [listOfNodes, listOfAlwaysPass, listOfPassIfTrue, listOfPassIfFalse]
 * @param code
 * @param inputVector
 * @returns {{nodes: Array, always: Array, dit: Array, dif: Array}}
 * @constructor
 */
const TransCodeToCFG = (code, inputVector) => {
    let curAns = {nodes: [], always: [], dit: [], dif: []};
    CFGFromColoredTree(getBody(code, inputVector), 1, curAns);
    return curAns;
};

const CFGFromColoredTree = (body, nodeNumber, graphDS) => {
    return collect(null, body, 0, nodeNumber, graphDS);
};

function collectHelper(body, loc, lastNode, nodeNumber, graphDS) {
    return collectorMap[body[loc].type] !== undefined ? collectorMap[body[loc].type](lastNode, body, loc, nodeNumber, graphDS) :
        collectOthers(lastNode, body, loc, nodeNumber, graphDS);
}


//
const collect = (lastNode, body, loc, nodeNumber, graphDS) => {
    if (loc === body.length)
        return [lastNode.id, nodeNumber];
    return collectHelper(body, loc, lastNode, nodeNumber, graphDS);
};

const isCollector = (body, loc) => {
    return body[loc].type !== 'ReturnStatement' && body[loc].type !== 'IfStatement' && body[loc].type !== 'WhileStatement';
};

const extractCollectors = (body, loc) => {
    let collectedStatements = [];
    for (loc; loc < body.length; loc++) {
        if (isCollector(body, loc))
            collectedStatements.push(body[loc]);
        else
            break;
    }
    return [wrapInBlock(collectedStatements), loc];
};

const collectOthers = (lastNode, body, loc, nodeNumber, graphDS) => {
    let extracted = extractCollectors(body, loc);
    loc = extracted[1];
    let curNode = createNode(nodeNumber, extracted[0], normalShape, extracted[0].color);
    nodeNumber++;
    graphDS.nodes.push(curNode);
    if (lastNode !== null)
        graphDS.always.push([lastNode.id, curNode.id]);
    return collect(curNode, body, loc, nodeNumber, graphDS);
};

const wrapInBlock = (collectorStatements) => {
    return {
        type: 'BlockStatement', body: collectorStatements, generator: false, expression: false,
        async: false, color: collectorStatements[0].color
    };
};

const consNode = (number, text, type, color) => {
    return {id: number, label: text, shape: type, color: {background: color, border: 'black'}};
};

const createNode = (number, nodeText, type, color) => {
    let textCopy = nodeText;
    if (nodeText.type !== undefined)
        textCopy = NodeToString(escodegen.generate(nodeText));
    return consNode(number, number > 0 ?  number + ': ' + textCopy : textCopy
        , type, color === undefined ? 'white' : color);
};


const NodeToString = (text) => {
    let newText = splitAndJoinBy('\n', '', text);
    newText = splitAndJoinBy('{', '', newText);
    newText = splitAndJoinBy('}', '', newText);
    newText = splitAndJoinBy('let', '', newText);
    newText = splitAndJoinBy(';', '\n', newText);
    return newText;
};

const splitAndJoinBy = (regexS, regexJ, text) => text.split(regexS).join(regexJ);

function whileHandler(lastNode, body, loc, nodeNumber, graphDS){
    let emptyNode = createNode(nodeNumber, 'NULL', normalShape, greenColor);
    graphDS.nodes.push(emptyNode); nodeNumber++;
    let curStatement = body[loc]; loc++;
    let testNode = createNode(nodeNumber, curStatement.test, rhombusShape, curStatement.color);
    graphDS.nodes.push(testNode);
    nodeNumber++;
    let whileBodyNode = createNode(nodeNumber, curStatement.body, normalShape, curStatement.body.color);
    graphDS.nodes.push(whileBodyNode);
    nodeNumber++;
    graphDS.always.push([lastNode.id, emptyNode.id]);
    graphDS.always.push([emptyNode.id, testNode.id]);
    graphDS.always.push([whileBodyNode.id, emptyNode.id]);
    graphDS.dit.push([testNode.id, whileBodyNode.id]);
    graphDS.dif.push([testNode.id, nodeNumber]);
    return collect(null, body, loc, nodeNumber, graphDS);
}

function ifStatementHelper (ifStatement, newNode, nodeNumber, graphDS, prevNode, body, loc){
    let output = addIfStatementToGraphDS(ifStatement, newNode, nodeNumber, graphDS);
    graphDS = output[0];
    nodeNumber = output[1];
    let lastTestNode = output[2];
    graphDS.always.push([prevNode.id, lastTestNode.id]);
    if (ifStatement.alternate === null) {
        graphDS.dif.push([lastTestNode.id, -nodeNumber]);
        return collect(newNode, body, loc, nodeNumber, graphDS);
    }
    return altHandler(lastTestNode, newNode, ifStatement.alternate, body, loc, nodeNumber, graphDS);
}


//let ifStatement = body[loc];
//     loc++;
//     let emptyNumber = -nodeNumber;
//     let emptyNode = createNode(emptyNumber, '', roundedShape, ifStatement.test.color);
//     graphDS.nodes.push(emptyNode);
//     return ifStatementHelper(ifStatement, emptyNode, nodeNumber, graphDS, lastNode, body, loc);

const ifHandler = (lastNode, body, index, nodeNumber, curAns) =>{
    let ifStatement = body[index];
    index++;
    let emptyNumber= -nodeNumber;
    let emptyNode = createNode(emptyNumber, '', roundedShape, ifStatement.test.color);
    curAns.nodes.push(emptyNode);
    let output = addIfStatementToGraphDS(ifStatement, emptyNode, nodeNumber, curAns);
    curAns = output[0];
    nodeNumber = output[1];
    let lastTestNode = output[2];
    let testNodeNumber = lastTestNode.id;
    curAns.always.push([lastNode.id, testNodeNumber]);
    if(ifStatement.alternate === null){
        curAns.dif.push([testNodeNumber, emptyNumber]);
        return collect(emptyNode, body, index, nodeNumber, curAns);
    }
    return altHandler(lastTestNode, emptyNode, ifStatement.alternate, body, index, nodeNumber, curAns);


};

const altHandler = (lastTest, sharedEmptyNode, alt, body, loc, nodeNumber, graphDS) =>{
    if (alt.type === 'IfStatement')
        return ifStatementHelper(alt, sharedEmptyNode, nodeNumber, graphDS, lastTest, body, loc);
    return altHelper(lastTest, sharedEmptyNode, alt, body, loc, nodeNumber, graphDS);
};

const altHelper = (lastTest, sharedEmptyNode, alt, body, loc, nodeNumber, graphDS) => {
    graphDS.dif.push([lastTest.id, nodeNumber]);
    let output = CFGFromColoredTree(alt.body, nodeNumber, graphDS);
    let lastAlterNumber = output[0];
    nodeNumber = output[1];
    graphDS.always.push([lastAlterNumber, sharedEmptyNode.id]);
    return collect(sharedEmptyNode, body, loc, nodeNumber, graphDS);
};

const retHandler = (lastNode, body, loc, nodeNumber, graphDS) =>{
    let returnNode = createNode(nodeNumber, body[loc], normalShape, body[loc].color);
    graphDS.nodes.push(returnNode);
    if (lastNode !== null)
        graphDS.always.push([lastNode.id, returnNode.id]);
    return [nodeNumber - 1, nodeNumber];
};

let collectorMap = {
    'IfStatement': ifHandler,
    'WhileStatement': whileHandler,
    'ReturnStatement': retHandler
};

const addIfStatementToGraphDS = (ifStatement, newNode, nodeNumber, graphDS)  =>{
    let testNode = createNode(nodeNumber, ifStatement.test, rhombusShape, ifStatement.test.color);
    nodeNumber++;
    graphDS.nodes.push(testNode);
    graphDS.dit.push([testNode.id, nodeNumber]);
    let output = CFGFromColoredTree(ifStatement.consequent.body, nodeNumber, graphDS);
    let lastConsqNumber = output[0];
    nodeNumber = output[1];
    graphDS.always.push([lastConsqNumber, newNode.id]);
    return [graphDS, nodeNumber, testNode];
};

function refreshFunctionStatements(substitutedTree, functionStatementIndex) {
    return parseCode(escodegen.generate(substitutedTree.body[functionStatementIndex])).body[0];
}

const paintTreeWVector = (codeToPaint, inputVector) => {
    setInputVector(inputVector);
    let originalTree = parseCode(codeToPaint);
    let substitutedTree = parseCode(codeToPaint);
    symbolicSubstitution(substitutedTree);
    let functionStatementIndex = getLocOfFunc(substitutedTree.body);
    if (functionStatementIndex === -1)
        return [originalTree, []];
    let functionStatement = refreshFunctionStatements(substitutedTree, functionStatementIndex);
    originalTree.body[functionStatementIndex] = refreshFunctionStatements(originalTree, functionStatementIndex);
    substituteFromParsed(functionStatement.body, inputVector);
    let coloredRows = [[], []];
    traverseTreeAndPaintNodes(functionStatement.body.body, originalTree.body[functionStatementIndex].body.body, coloredRows);
    updateColoredRowWithFunctionIndex(functionStatementIndex, coloredRows);
    return [originalTree, coloredRows];
};

const updateColoredRowWithFunctionIndex = (functionStatementIndex, coloredRows) => {
    updateRowsWithFunctionIndex(functionStatementIndex, coloredRows[0]);
    updateRowsWithFunctionIndex(functionStatementIndex, coloredRows[1]);
};

const updateRowsWithFunctionIndex = (functionStatementIndex, coloredRows) =>{
    for (let index = 0; index < coloredRows.length; index++)
        coloredRows[index] += functionStatementIndex;
};

const setInputVector = (inputVector) => {
    for (let key in inputVector)
        inputVector[key] = consLiteral(inputVector[key], inputVector[key]);
};

const consLiteral = (value, raw) => {
    return {'type': 'Literal', 'value': value, 'raw': raw};
};

const traverseTreeAndPaintNodes = (preparedBody, originalBody, coloredRows) => {
    for (let sharedIndex = 0; sharedIndex < preparedBody.length; sharedIndex++) {
        if (preparedBody[sharedIndex].type === 'IfStatement') {
            originalBody[sharedIndex].test.color = greenColor;
            if (evalExp(preparedBody[sharedIndex].test))
                paintConsequent(preparedBody[sharedIndex], originalBody[sharedIndex], coloredRows);
            else {
                if (preparedBody[sharedIndex].alternate !== null)
                    paintAlternate(preparedBody[sharedIndex], originalBody[sharedIndex], coloredRows);
                else
                    coloredRows[1].push(originalBody[sharedIndex].loc.start.line);
            }
        }
        else {
            originalBody[sharedIndex].color = greenColor;
            coloredRows[0].push(originalBody[sharedIndex].loc.start.line);
        }
    }
};

const evalExp = (exp) => eval(escodegen.generate(exp));

const paintConsequent = (curPreparedStatement, curOriginalStatement, coloredRows) => {
    curOriginalStatement.consequent.color = greenColor;
    coloredRows[0].push(curOriginalStatement.loc.start.line);
    traverseTreeAndPaintNodes(curPreparedStatement.consequent.body, curOriginalStatement.consequent.body, coloredRows);
};

function traverseAlt(curPreparedStatement, curOriginalStatement, coloredRows) {
    traverseTreeAndPaintNodes(extractBodyFromBlock(curPreparedStatement.alternate), extractBodyFromBlock(curOriginalStatement.alternate), coloredRows);
}

const paintAlternate = (curPreparedStatement, curOriginalStatement, coloredRows) => {
    coloredRows[1].push(curOriginalStatement.loc.start.line);
    curOriginalStatement.color = greenColor;
    if (curPreparedStatement.alternate.type === 'BlockStatement') {
        curOriginalStatement.alternate.color = greenColor;
        coloredRows[0].push(curOriginalStatement.alternate.loc.start.line);
    }
    traverseAlt(curPreparedStatement, curOriginalStatement, coloredRows);
}; 

const extractBodyFromBlock = (statement) => {
    return statement.type === 'BlockStatement' ? statement.body : [statement];
};

const getLocOfFunc = (body) => {
    for (let i = 0; i < body.length; i++)
        if (body[i].type === 'FunctionDeclaration')
            return i;
    return -1;
};

export {TransCodeToCFG};
