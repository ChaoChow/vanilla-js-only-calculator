DECIMAL_CHARCTER = '.';
CLEAR_TEXT = 'C';
ALL_CLEAR_TEXT = 'AC';
ZERO_TEXT = '0';
NEGATIVE_SYMBOL_TEXT = '-';
EMPTY_TEXT = '';
CLICK_EVENT = 'click';
MAX_CHAR_LIMIT = 9;
ACTIVE_OP_BUTTON_CLASS_NAME = 'op-btn-highlight';
BUTTON_SUFFIX = '-btn';
OPERATION_ATTRIBUTE = 'operation';
HIGHLIGHT_OPERATION_BUTTON_CLASS = 'op-btn-highlight';

const STACK_ITEM_TYPE = {
  OPERATION: 'OPERATION',
  USER_INPUT: 'USER_INPUT',
  RESULT: 'RESULT',
}

const STACK_ERROR_TYPE = {
  ITEM_NULL: 'ITEM_NULL',
  MISSING_REQUIRED_ITEMS: 'MISSING_REQUIRED_ITEMS',
  CALCULATION_FAILURE: 'CALCULATION_FAILURE',
}

const OPERATION_TYPE = {
  SUM: 'sum',
  SUBTRACT: 'subtract',
  MULTIPLY: 'multiply',
  DIVIDE: 'divide'
}

class Compute {
  static sum(lhs, rhs) {return lhs + rhs;}
  static subtract(lhs, rhs) {return lhs - rhs;}
  static multiply(lhs, rhs) {return lhs * rhs;}
  static divide(lhs, rhs) {return lhs / rhs;}
}

class StackItem {
  constructor(stackItemType, value) {
    this.stackItemType = stackItemType;
    this.value = value ? value : '';
  }
}

class StackItemConverter {
  static toNumber(rawString) {
    return parseFloat(this.toDisplayString(rawString));
  }

  static toDisplayString(rawString) {
    // Edge cases include '.' | '-' | '-.' | '-.*' | '' where * is any number
    if (rawString[0] === DECIMAL_CHARCTER) {
      // '.'
      return ZERO_TEXT + rawString;
    } else if (rawString === NEGATIVE_SYMBOL_TEXT) {
      // '-'
      return rawString + ZERO_TEXT;
    } else if (rawString[0] === NEGATIVE_SYMBOL_TEXT && rawString[1] === DECIMAL_CHARCTER) {
      // '-.*'
      return NEGATIVE_SYMBOL_TEXT + ZERO_TEXT + rawString.substring(1);
    } else if (rawString === EMPTY_TEXT) {
      // ''
      return ZERO_TEXT;
    }

    // Raw string is display string quality
    return rawString;
  }
}

class CalculatorService {
  constructor(renderResultFunction) {
    this.renderResultFunction = renderResultFunction;
    this.clearAll();
  }

  clear() {
    let topStackItem = this.getStackItem(0);

    if (topStackItem.stackItemType === STACK_ITEM_TYPE.USER_INPUT ||
        topStackItem.stackItemType === STACK_ITEM_TYPE.RESULT) {
      topStackItem.value = EMPTY_TEXT;
    } else {
      // Top stack item must be operation, insert a new top stack item
      this.calculatorStack.push(new StackItem(STACK_ITEM_TYPE.USER_INPUT));
      topStackItem = this.getStackItem(0);
    }

    this.renderResultFunction(topStackItem.value);
  }

  clearAll() {
    const emptyStackItem = new StackItem(STACK_ITEM_TYPE.USER_INPUT);
    this.calculatorStack = [emptyStackItem];
    this.renderResultFunction(emptyStackItem.value)
  }

  addNumChar(numChar) {
    // If top stack item is undefined or isn't a user input, add one in
    let topStackItem = this.calculatorStack[this.calculatorStack.length - 1];
    if (topStackItem == null || topStackItem.stackItemType !== STACK_ITEM_TYPE.USER_INPUT) {
      this.calculatorStack.push(new StackItem(STACK_ITEM_TYPE.USER_INPUT));
      topStackItem = this.calculatorStack[this.calculatorStack.length - 1];
    }

    if (numChar === DECIMAL_CHARCTER && topStackItem.value.includes(DECIMAL_CHARCTER)) {
      return;
    }

    topStackItem.value += numChar;
    this.renderResultFunction(topStackItem.value);
  }

  addOperation(operation) {
    const topStackItem = this.getStackItem(0);

    switch (topStackItem.stackItemType) {
      case STACK_ITEM_TYPE.OPERATION:
        topStackItem.value = operation;
        break;
      case STACK_ITEM_TYPE.USER_INPUT:
        try { this.computeStack(); } catch {}
        // INTENTIONAL FALL THROUGH
      case STACK_ITEM_TYPE.RESULT:
        // INTENTIONAL FALL THROUGH
        this.calculatorStack.push(new StackItem(STACK_ITEM_TYPE.OPERATION, operation));
    }
  }

  flipNumberSign() {
    // Only operate if top stack item is a user input item
    let topStackItem = this.getStackItem(0);
    if (topStackItem.stackItemType === STACK_ITEM_TYPE.OPERATION) {
      // Copy second item to top
      this._copyStackItemToTop(1);
      topStackItem = this.getStackItem(0);
    }

    // Left expression makes number positive, right, negative
    topStackItem.value = (topStackItem.value[0] === NEGATIVE_SYMBOL_TEXT) ?
      topStackItem.value.substring(1) : NEGATIVE_SYMBOL_TEXT + topStackItem.value;

    this.renderResultFunction(topStackItem.value);
  }

  computeResult() {
    const topStackItem = this.getStackItem(0);

    switch (topStackItem.stackItemType) {
      case STACK_ITEM_TYPE.RESULT:
        this._copyStackItemToTop(2);
        this._copyStackItemToTop(2); // Previous item at index 1 is now at index 2
        break;
      case STACK_ITEM_TYPE.OPERATION:
        this._copyStackItemToTop(1);
        break;
    }

    this.computeStack();
  }

  computeStack() {
    const lhsNumber = StackItemConverter.toNumber(this.getStackItem(0).value);
    const operation = this.getStackItem(1).value; // Operation requires no conversion
    const rhsNumber = StackItemConverter.toNumber(this.getStackItem(2).value);

    const result = Compute[operation](rhsNumber, lhsNumber);
    const resultStackItem = new StackItem(STACK_ITEM_TYPE.RESULT, result.toString());
    this.calculatorStack.push(resultStackItem);

    this.renderResultFunction(resultStackItem.value);

    // Cleanup the calculator stack by removing things from the back (front of array)
    // Just arbitrary numbers to keep the memory heap clean
    if (this.calculatorStack.length > 3) {
      // Bring stack size down to 3
      this.calculatorStack.splice(0, this.calculatorStack.length - 3);
    }
  }

  getStackItem(index) {
    const topStackItem = this.calculatorStack[this.calculatorStack.length - index - 1];
    if (topStackItem.stackItemType == null) {
      // Not ready to compare
      throw new Error(STACK_ERROR_TYPE.ITEM_NULL);
    }

    return topStackItem;
  }

  _copyStackItemToTop(index) {
    const targetStackItem = this.getStackItem(index);
    this.calculatorStack.push(targetStackItem);
  }
}

const calcDisplayElement = document.getElementById('calc-display');

renderDisplayNumber = function(rawString) {
  calcDisplayElement.value = StackItemConverter.toDisplayString(rawString);
}

const calculatorService = new CalculatorService(renderDisplayNumber);

const clearButtonElement = document.getElementById('clear-btn');

const divideButtonElement = document.getElementById('divide-btn');
const multiplyButtonElement = document.getElementById('multiply-btn');
const subtractButtonElement = document.getElementById('subtract-btn');
const sumButtonElement = document.getElementById('sum-btn');

const operationButtonElementArray = [divideButtonElement, multiplyButtonElement, subtractButtonElement, sumButtonElement];

highlightOperationButton = function() {
  const topStackItem = calculatorService.getStackItem(0);
  const nextStackItem = calculatorService.getStackItem(1);

  // Clear everything first
  operationButtonElementArray
    .forEach(element => element.classList.remove(HIGHLIGHT_OPERATION_BUTTON_CLASS));

  if (topStackItem.stackItemType === STACK_ITEM_TYPE.OPERATION) {
    // Highlight operation button if the operation stack item is top in queue
    operationButtonElementArray.filter(element => element.getAttribute(OPERATION_ATTRIBUTE) === topStackItem.value)
      .forEach(element => element.classList.add(HIGHLIGHT_OPERATION_BUTTON_CLASS));
  } else if (topStackItem.stackItemType === STACK_ITEM_TYPE.USER_INPUT &&
      topStackItem.value === EMPTY_TEXT &&
      nextStackItem.stackItemType === STACK_ITEM_TYPE.OPERATION) {
    // If top stack item is empty and the next stack item is operation
    operationButtonElementArray.filter(element => element.getAttribute(OPERATION_ATTRIBUTE) === nextStackItem.value)
      .forEach(element => element.classList.add(HIGHLIGHT_OPERATION_BUTTON_CLASS));
  }
}

determineClearButtonState = function() {
  const topStackItem = calculatorService.getStackItem(0);

  if (topStackItem.value === EMPTY_TEXT) {
    clearButtonElement.innerHTML = ALL_CLEAR_TEXT;
  } else {
    clearButtonElement.innerHTML = CLEAR_TEXT;
  }
}

performClearOperation = function() {
  if (clearButtonElement.innerHTML === ALL_CLEAR_TEXT) {
    calculatorService.clearAll();
  } else {
    calculatorService.clear();
  }
}

Array.from(document.getElementsByClassName('num-btn'))
  .forEach(numButton => {
    numButton.addEventListener(CLICK_EVENT, () => {
      calculatorService.addNumChar(numButton.innerHTML);
      determineClearButtonState();
      highlightOperationButton();
    });
});

document.getElementById('clear-btn')
  .addEventListener(CLICK_EVENT, () => {
    performClearOperation();
    determineClearButtonState();
    highlightOperationButton();
});

document.getElementById('sign-toggle-btn')
  .addEventListener(CLICK_EVENT, () => {
    calculatorService.flipNumberSign();
    determineClearButtonState();
});

Array.from(document.getElementsByClassName('op-btn'))
  .forEach(opButton => {
    opButton.addEventListener(CLICK_EVENT, () => {
      calculatorService.addOperation(opButton.getAttribute(OPERATION_ATTRIBUTE));
      highlightOperationButton();
    });
});

document.getElementById('equals-btn')
  .addEventListener(CLICK_EVENT, () => {
    calculatorService.computeResult();
    highlightOperationButton();
  }
);
