import $ from 'jquery';
import {TransCodeToCFG} from './code-analyzer';
import {generate} from './generate-graph';

$(document).ready(function () {
    $('#colorCodeButton').click(() => {
        let codeToParse = $('#codeToColorPlaceholder').val();
        let inputVectorString = $('#functionInput').val();
        let inputVector = JSON.parse(inputVectorString);
        let graphDS = TransCodeToCFG(codeToParse, inputVector);
        //$('#tests').val(JSON.stringify(graphDS));
        generate(graphDS);
    });
});

