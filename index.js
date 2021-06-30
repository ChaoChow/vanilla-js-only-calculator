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

const STACK_ITEM_TYPE = {
  OPERATION: 'OPERATION',
  USER_INPUT: 'USER_INPUT',
  RESULT: 'RESULT',
}

const STACK_ERROR_TYPE = {
  ITEM_NULL: 'ITEM_NULL',
  MISSING_REQUIRED_ITEMS: 'MISSING_REQUIRED_ITEMS',
}

class Compute {
  static sum(lhs, rhs) {return lhs + rhs;}
  static subtract(lhs, rhs) {return lhs - rhs;}
  static multiply(lhs, rhs) {return lhs * rhs;}
  static divide(lhs, rhs) {return lhs / rhs;}
  static mod(lhs, rhs) {return lhs % rhs;}
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
    this.clear();
  }

  clear() {
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
    const topStackItem = this._getStackItem(0);

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
        return true;
    }
  }

  flipNumberSign() {
    // Only operate if top stack item is a user input item
    let topStackItem = this._getStackItem(0);
    if (topStackItem.stackItemType === STACK_ITEM_TYPE.OPERATION) {
      // Copy second item to top
      this._copyStackItemToTop(1);
      topStackItem = this._getStackItem(0);
    }

    // Left expression makes number positive, right, negative
    topStackItem.value = (topStackItem.value[0] === NEGATIVE_SYMBOL_TEXT) ?
      topStackItem.value.substring(1) : NEGATIVE_SYMBOL_TEXT + topStackItem.value;

    this.renderResultFunction(topStackItem.value);
  }

  computeResult() {
    const topStackItem = this._getStackItem(0);

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
    const lhsNumber = StackItemConverter.toNumber(this._getStackItem(0).value);
    const operation = this._getStackItem(1).value; // Operation requires no conversion
    const rhsNumber = StackItemConverter.toNumber(this._getStackItem(2).value);

    const result = Compute[operation](rhsNumber, lhsNumber);
    const resultStackItem = new StackItem(STACK_ITEM_TYPE.RESULT, result.toString());
    this.calculatorStack.push(resultStackItem);

    this.renderResultFunction(resultStackItem.value);
  }

  _getStackItem(index) {
    const topStackItem = this.calculatorStack[this.calculatorStack.length - index - 1];
    if (topStackItem.stackItemType == null) {
      // Not ready to compare
      throw new Error(STACK_ERROR_TYPE.ITEM_NULL);
    }

    return topStackItem;
  }

  _copyStackItemToTop(index) {
    const targetStackItem = this._getStackItem(index);
    this.calculatorStack.push(targetStackItem);
  }
}

const calcDisplayElement = document.getElementById('calc-display');

renderDisplayNumber = function(rawString) {
  calcDisplayElement.value = StackItemConverter.toDisplayString(rawString);
}

const calculatorService = new CalculatorService(renderDisplayNumber);


Array.from(document.getElementsByClassName('num-btn'))
  .forEach(numButton => {
    numButton.addEventListener(CLICK_EVENT, () => {
      calculatorService.addNumChar(numButton.innerHTML);
    });
});

document.getElementById('clear-btn')
  .addEventListener(CLICK_EVENT, () => {
    calculatorService.clear();
});

document.getElementById('sign-toggle-btn')
  .addEventListener(CLICK_EVENT, () => {
    calculatorService.flipNumberSign();
});

Array.from(document.getElementsByClassName('op-btn'))
  .forEach(opButton => {
    opButton.addEventListener(CLICK_EVENT, () => {
      calculatorService.addOperation(opButton.getAttribute('operation'));
    });
});

document.getElementById('equals-btn')
  .addEventListener(CLICK_EVENT, () => {
    calculatorService.computeResult();
  }
);
