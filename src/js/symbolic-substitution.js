const escodegen = require('escodegen');

const whileStatementSubstitution = (parsed, environment) => {
    substituteValue(parsed.test, environment);
    let envCopy = Object.assign({}, environment);
    substituteFromParsed(parsed.body, envCopy);
};

const assignmentExpressionSubstitution = (parsed, environment) => {
    parsed.right = substituteValue(parsed.right, environment);
    environment[parsed.left.name] = parsed.right;
};

const expressionStatementSubstitution = (parsed, environment) => {
    substituteFromParsed(parsed.expression, environment);
};

const seqExpHandler = (parsed, environment) =>{
    parsed.expressions.map((exp)=>substituteFromParsed(exp, environment));
};

const returnStatementSubstitution = (parsed, environment) => {
    parsed.argument = substituteValue(parsed.argument, environment);
};

const ifStatementSubstitution = (parsed, environment) => {
    parsed.test = substituteValue(parsed.test, environment);
    substituteFromParsed(parsed.consequent, Object.assign({}, environment));
    if (parsed.alternate !== null) substituteFromParsed(parsed.alternate, Object.assign({}, environment));
};

const blockStatementSubstitution = (block, environment) => {
    block.body.map((exp) => substituteFromParsed(exp, environment));
};

const updateExpressionSubstitution = () => {
};

const handleFunctionParameters = (listOfParameters, environment) => {
    listOfParameters.forEach((item) => consIdentifier(item, environment));
};

const consIdentifier = (item, environment) => {
    environment[item.name] = {
        'type': 'Identifier',
        'name': item.name
    };
};

const functionDeclarationSubstitution = (parsed, environment) => {
    handleFunctionParameters(parsed.params, environment);
    substituteFromParsed(parsed.body, environment);
};

const symbolicSubstitution = (parsedToSubstitute, environment) => {
    environment = environment || {};
    substituteFromParsed(parsedToSubstitute, environment);
    return parsedToSubstitute;
};

const substituteFromParsed = (parsed, environment) => {
    typeToSubstitutionMap[parsed.type](parsed, environment);
};

const programSubstitution = (parsed, environment) => {
    parsed.body.map((exp) => substituteFromParsed(exp, environment));
};

const variableDeclarationSubstitution = (parsed, environment) => {
    parsed.declarations.map((dec) => variableDeclaratorSubstitution(dec, environment));
};

const variableDeclaratorSubstitution = (parsed, environment) => {
    let init = parsed.init;
    init = substituteValue(init, environment);
    environment[parsed.id.name] = init;
    parsed.init = init;
};

const substituteValue = (parsedValue, environment) => {
    return substituteValueMap[parsedValue.type](parsedValue, environment);
};

const evalExp = (exp) => eval(escodegen.generate(exp));

const binaryExpressionValueSub = (parsedValue, environment) => {
    parsedValue.left = substituteValue(parsedValue.left, environment);
    parsedValue.right = substituteValue(parsedValue.right, environment);
    if (isLiteralNumber(parsedValue.left) && isLiteralNumber(parsedValue.right))
        return consLiteral(evalExp(parsedValue) , 'evaluated');
    return parsedValue;
};

const consLiteral = (value, raw) => {
    return {'type': 'Literal', 'value': value, 'raw': raw};
};

const isLiteralNumber = (parsed) => {
    return (parsed.type === 'Literal' && !isNaN(parsed.value));
};

const identifierValueSub = (parsedValue, environment) => {
    return environment[parsedValue.name];
};

const literalValueSub = (parsedValue) => {
    return parsedValue;
};

let substituteValueMap = {
    'BinaryExpression': binaryExpressionValueSub,
    'Identifier': identifierValueSub,
    'Literal': literalValueSub
};

let typeToSubstitutionMap = {
    'Program': programSubstitution,
    'VariableDeclaration': variableDeclarationSubstitution,
    'FunctionDeclaration': functionDeclarationSubstitution,
    'BlockStatement': blockStatementSubstitution,
    'IfStatement': ifStatementSubstitution,
    'ReturnStatement': returnStatementSubstitution,
    'ExpressionStatement': expressionStatementSubstitution,
    'AssignmentExpression': assignmentExpressionSubstitution,
    'SequenceExpression' : seqExpHandler,
    'WhileStatement': whileStatementSubstitution,
    'UpdateExpression': updateExpressionSubstitution
};

export {symbolicSubstitution, substituteFromParsed};


