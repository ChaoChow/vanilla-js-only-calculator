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

class Compute {
  static sum(lhs, rhs) {return lhs + rhs;}
  static subtract(lhs, rhs) {return lhs - rhs;}
  static multiply(lhs, rhs) {return lhs * rhs;}
  static divide(lhs, rhs) {return lhs / rhs;}
  static mod(lhs, rhs) {return lhs % rhs;}
}

class CalculatorController {
  clear() {
    this.savedNumber = null;
    this.operation = null;
  }

  saveNumber(displayNumber, operation) {
    this.savedNumber = (this.savedNumber != null) ? this.compute(displayNumber) : displayNumber;
    this.operation = operation;

    return this.savedNumber;
  }

  compute(displayNumber) {
    if (this.savedNumber == null) {
      return displayNumber;
    }

    return Compute[this.operation](this.savedNumber, displayNumber);
  }
}

class UserInputModel {
  static toDisplayString(numberAsString) {
    if (numberAsString[0] === DECIMAL_CHARCTER) {
      return ZERO_TEXT + numberAsString;
    } else if (numberAsString === EMPTY_TEXT) {
      return ZERO_TEXT;
    } else {
      return numberAsString;
    }
  }

  get inputAsNumber() {
    return parseFloat(this.inputAsString);
  }

  get inputAsString() {
    return UserInputModel.toDisplayString(this.currentUserInput);
  }

  set inputAsString(value) {
    this.currentUserInput = UserInputModel.toDisplayString(value);
  }

  addChar(char) {
    if (char === DECIMAL_CHARCTER && this.currentUserInput.includes(DECIMAL_CHARCTER)) {
      return;
    } else if (this.numberOfNumChars() >= MAX_CHAR_LIMIT && char !== DECIMAL_CHARCTER) {
      return;
    }

    this.currentUserInput += char;
  }

  numberOfNumChars() {
    return Array.from(this.currentUserInput)
      .filter((char) => !isNaN(char))
      .length;
  }

  flipSign() {
    if (this.inputAsNumber < 0) {
      // Change negative to positive by removing "-" at front
      this.currentUserInput = this.currentUserInput.substring(1);
    } else if (this.inputAsNumber > 0) {
      // Change positive to negative by adding "-" to front
      this.currentUserInput = NEGATIVE_SYMBOL_TEXT + this.currentUserInput
    }
    // 0 is not positive nor negative
  }

  clear() {
    this.currentUserInput = '';
  }

  constructor() {
    this.clear();
  }
}

let userInputModel = new UserInputModel();
let calculatorController = new CalculatorController();

updateDisplayNumber = function(displayNumberString) {
  document.getElementById('calc-display').value = displayNumberString;
}

getDisplayNumber = function() {
  let rawDisplayNumber = document.getElementById('calc-display').value
  return parseFloat(rawDisplayNumber);
}

Array.from(document.getElementsByClassName('num-btn')).forEach(numButton => {
  numButton.addEventListener(CLICK_EVENT, () => {
    userInputModel.addChar(numButton.innerHTML);
    updateDisplayNumber(userInputModel.inputAsString)
  });
});

document.getElementById('clear-btn').addEventListener(CLICK_EVENT, () => {
  userInputModel.clear();
  calculatorController.clear();
  updateDisplayNumber(userInputModel.inputAsString);
});

document.getElementById('sign-toggle-btn').addEventListener(CLICK_EVENT, () => {
  userInputModel.inputAsString = getDisplayNumber().toString();
  userInputModel.flipSign();
  updateDisplayNumber(userInputModel.inputAsString);
});

Array.from(document.getElementsByClassName('op-btn')).forEach(opButton => {
  opButton.addEventListener(CLICK_EVENT, () => {
    const resultDisplayNumber = calculatorController.saveNumber(
      getDisplayNumber(),
      opButton.getAttribute('operation')
    );
    const resultDisplayString = UserInputModel.toDisplayString(resultDisplayNumber.toString());
    updateDisplayNumber(resultDisplayString);
    userInputModel.clear();
  });
});

document.getElementById('equals-btn').addEventListener(CLICK_EVENT, () => {
  const resultDisplayNumber = calculatorController.compute(getDisplayNumber());
  const resultDisplayString = UserInputModel.toDisplayString(resultDisplayNumber.toString());
  updateDisplayNumber(resultDisplayString);
  userInputModel.clear();
  calculatorController.clear();
});
