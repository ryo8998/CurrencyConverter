const config = {
    user:"ryo8998",
    inputTarget:document.getElementById("cli-input"),
    outputTarget: document.getElementById("cli-output-container"),
}

const currencyExchangeRateToYen = {
    "India":{"Rupee":1.4442,"Paisa":0.014442},
    "USA":{"Dollar":106.1,"UsCent":1.0610},
    "Europe":{"Euro":125.56,"EuroCent":1.2556},
    "UAE":{"Dirham":28.89,"Fils":0.2889}
}


class CommandNode{
    static commandID = 1;
    constructor(command){ // String
        this.down = null;
        this.up = null;
        this.command = command;
        this.commandID = CommandNode.commandID;
        CommandNode.commandID++;
    }
}

class CommandLine{
    constructor() {
        this.top = null;
        this.bottom = null;
    }

    push(command){ // String -> void
        if(this.top === null){
            this.top = new CommandNode(command);
            this.bottom = this.top;
        }else{
            let newNode = new CommandNode(command);
            let tmp = this.top;
            this.top = newNode;
            newNode.down = tmp;
            newNode.down.up = newNode;
        }
    }

    pop(){ // -> String
        if(this.top === null) return null;
        let tmp = this.top;
        this.top = this.top.down;
        return tmp.command
    }

    peek(){ // -> String
        if(this.top === null) return null;
        return this.top.command
    }
}

const cl = new CommandLine();
let iterator = cl.top;


config.inputTarget.addEventListener("keypress",function(e){
    if(e.key === "Enter"){
     
        let parsedStringInputArray = CurrencyConverter.commnadLineParser(this.value)
        let validatorResponse = CurrencyConverter.parsedArrayVailidator(parsedStringInputArray);
        cl.push(this.value);
        iterator = cl.top;

        if(validatorResponse["isValid"]===false) {
            View.renderCommand(cl);
            View.renderResult(validatorResponse["error"],false);
            View.clearInput();
            return;
        }else{
            View.renderCommand(cl);
            let result;
            if(parsedStringInputArray[1]==="showAvailableLocales") result = CurrencyConverter.showAvailableLocales();
            if(parsedStringInputArray[1]==="showDenominations") result = CurrencyConverter.showDenominations(parsedStringInputArray[2])
            if(parsedStringInputArray[1]==="convert") result = CurrencyConverter.convert(...parsedStringInputArray.slice(2)); 
            View.renderResult(result,true);
            View.clearInput();
        }        
           
    }
})

config.inputTarget.addEventListener("keydown",function(e){
    if(e.key=="ArrowUp"){
        if(iterator){
            View.renderHistoryCommand(iterator.command);
            iterator = iterator.down? iterator.down : iterator;
        }
    }
    if(e.key == "ArrowDown"){
        if(iterator.up){
            iterator = iterator.up;
            View.renderHistoryCommand(iterator.command);
        }
    }
})

class View{

    static renderCommand(commandLineObj){ //commandLineObj -> void
        config.outputTarget.innerHTML += `
        <p class="text-white my-0">
        <span style='color:green'>${config.user}</span>
        <span style='color:magenta'>@</span>
        <span style='color:blue'>recursionist</span>
        : ${commandLineObj.peek()}     
        </p>
        `    
    }
    static clearInput(){
        config.inputTarget.value = ""; 
    }

    static renderResult(result,isValid){ //String, boolean -> void
        config.outputTarget.innerHTML += `
        <p class="text-white my-0">
        <span style='color:${isValid?"turquoise":"red"}'>CurrencyConvert${isValid?"":"Error"}</span>
        : ${result}     
        </p>
        `
    }
    static renderHistoryCommand(command){ // String -> void
        config.inputTarget.value = command;
    }
}




class CurrencyConverter{


    static commnadLineParser(command){ // String -> Array
        let parsedStringInputArray = command.trim().split(" ");
        return parsedStringInputArray;
    }

    static parsedArrayVailidator(parsedStringInputArray){ //Array -> obj{"isValid":boolean,"error":errorMessage}
        let validatorResponse = this.universalValidator(parsedStringInputArray);

        if (!validatorResponse['isValid']) return validatorResponse;
        
        validatorResponse = this.commandArgumentsValidator(parsedStringInputArray);
        if (!validatorResponse['isValid']) return validatorResponse;

        return {'isValid': true, 'error':''}
    }

    static universalValidator(parsedStringInputArray){ // Array -> obj{"isValid":boolean,"error":errorMessage}
        let validCommandList = ["showAvailableLocales","showDenominations","convert"];
        if(parsedStringInputArray[0]!=="CurrencyConvert") return {"isValid":false,"error":'You must start with "CurrencyConvert"'};
        if(parsedStringInputArray.length === 1) return {"isValid":false,"error":`You need to input some command like ${validCommandList.join(', ')}`};
        if(parsedStringInputArray.length >=2 && validCommandList.indexOf(parsedStringInputArray[1])<0) {
            return {"isValid":false,"error":'No such Command('+parsedStringInputArray[1]+')'}
        };
        return {"isValid":true,"error":""};
    }

    static commandArgumentsValidator(parsedStringInputArray){ //Array -> obj{"isValid":boolean,"error":errorMessage}
        let singleArgumetCommand = ["showDenominations"];
        let tripleArgumetCommand = ["convert"];
        let argsArr = parsedStringInputArray.slice(2);
        
        if(singleArgumetCommand.indexOf(parsedStringInputArray[1])!=-1){
            return CurrencyConverter.singleArgValidator(parsedStringInputArray[1],argsArr[0]);
        }

        if(tripleArgumetCommand.indexOf(parsedStringInputArray[1]) !=-1){
            return CurrencyConverter.tripleArgValidator(parsedStringInputArray[1],argsArr);
        }
        return {"isValid":true,"error":""};
    }

    static singleArgValidator(command,argString){ //String, Array -> obj{"isValid":boolean,"error":errorMessage}
        let validLocation = Object.keys(currencyExchangeRateToYen);
        if(command === "showDenominations" && validLocation.indexOf(argString) === -1){
            return {"isValid":false,"error":'Invalid Locale'}
        }
        return {"isValid":true,"error":""};
    }

    static tripleArgValidator(command,parsedArgArray){ //String, Array -> obj{"isValid":boolean,"error":errorMessage}
        if(parsedArgArray.length > 3) return {"isValid":false,"error":'Too much Argument'};
        let validateDenomi = ["Rupee","Paisa","Dollar","UsCent","Euro","EuroCent","Dirham","Fils"];

        if(validateDenomi.indexOf(parsedArgArray[0]) === -1 || validateDenomi.indexOf(parsedArgArray[2]) === -1){
            return {"isValid":false,"error":'Invalid argument'};
        }

        let sourceAmount = parseFloat(parsedArgArray[1]);
        if(typeof sourceAmount !== "number" && isNaN(sourceAmount)){
            return {"isValid":false,"error":'You must input number in the second argument'};
        }
        return {"isValid":true,"error":""};
    }

    static showAvailableLocales(){ //-> String
        return Object.keys(currencyExchangeRateToYen).join(", ");
    }

    static showDenominations(locale){ //String
        return Object.keys(currencyExchangeRateToYen[locale]).join(", ");
    }

    static convert(sourceDenomination, sourceAmount, destinationDenomination){ // String, Num, String
        let sourceDenomiRate = Object.keys(currencyExchangeRateToYen).map(locale => currencyExchangeRateToYen[locale][sourceDenomination]).filter(ele => ele)[0];
        let destiDenomiRate = Object.keys(currencyExchangeRateToYen).map(locale => currencyExchangeRateToYen[locale][destinationDenomination]).filter(ele => ele)[0];
        let convertedAmount = parseFloat(sourceAmount) * sourceDenomiRate / destiDenomiRate;
        return `${sourceAmount}${sourceDenomination} -> ${convertedAmount.toFixed(2)}${destinationDenomination} `   
    }

}
