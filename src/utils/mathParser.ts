/**
 * Highly robust recursive descent mathematical expression parser
 * Supports nested parentheses, PEMDAS, unary operations, constants, and custom functions.
 */
export function evaluateExpression(expr: string, isDegree: boolean = false): number {
  // Clean and prepare the expression:
  // Convert custom multiply and divide symbols to standard ones,
  // and handle custom constant symbols.
  let s = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/φ/g, 'phi')
    .replace(/\s+/g, ''); // strip all whitespace

  let pos = 0;

  function peek(): string {
    if (pos >= s.length) return '';
    return s[pos];
  }

  function next(): string {
    const char = peek();
    if (char) pos++;
    return char;
  }

  function parseExpression(): number {
    let result = parseTerm();
    while (true) {
      const op = peek();
      if (op === '+' || op === '-') {
        next();
        const term = parseTerm();
        if (op === '+') result += term;
        else result -= term;
      } else {
        break;
      }
    }
    return result;
  }

  function parseTerm(): number {
    let result = parsePower();
    while (true) {
      const op = peek();
      if (op === '*' || op === '/') {
        next();
        const factor = parsePower();
        if (op === '*') {
          result *= factor;
        } else {
          if (factor === 0) {
            throw new Error("Division by zero");
          }
          result /= factor;
        }
      } else {
        break;
      }
    }
    return result;
  }

  function parsePower(): number {
    let result = parseFactor();
    if (peek() === '^') {
      next();
      const exponent = parsePower(); // Right-associative exponentiation
      result = Math.pow(result, exponent);
    }
    return result;
  }

  function parseFactor(): number {
    const char = peek();
    
    // Unary plus/minus
    if (char === '-') {
      next();
      return -parseFactor();
    }
    if (char === '+') {
      next();
      return parseFactor();
    }
    
    // Parentheses
    if (char === '(') {
      next(); // Consume '('
      const val = parseExpression();
      if (next() !== ')') {
        throw new Error("Mismatched parentheses");
      }
      return val;
    }

    // Numbers
    if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (pos < s.length && /[0-9.]/.test(s[pos])) {
        numStr += s[pos++];
      }
      const parsedNum = parseFloat(numStr);
      if (isNaN(parsedNum)) {
        throw new Error(`Invalid number: ${numStr}`);
      }
      return parsedNum;
    }

    // Custom Named Identifiers (Constants and Functions)
    if (/[a-zA-Zπφ]/.test(char)) {
      let name = '';
      while (pos < s.length && /[a-zA-Zπφ]/.test(s[pos])) {
        name += s[pos++];
      }

      // Check if it's a constant
      if (name === 'pi' || name === 'π') return Math.PI;
      if (name === 'e') return Math.E;
      if (name === 'phi' || name === 'φ') return 1.618033988749895;

      // Check if it is a function call
      if (peek() === '(') {
        next(); // Consume '('
        const arg = parseExpression();
        if (next() !== ')') {
          throw new Error(`Mismatched parenthesis for function: ${name}`);
        }

        switch (name.toLowerCase()) {
          case 'sin': {
            const angle = isDegree ? (arg * Math.PI) / 180 : arg;
            // Handle precision limits for things like sin(pi)
            const res = Math.sin(angle);
            return Math.abs(res) < 1e-15 ? 0 : res;
          }
          case 'cos': {
            const angle = isDegree ? (arg * Math.PI) / 180 : arg;
            const res = Math.cos(angle);
            return Math.abs(res) < 1e-15 ? 0 : res;
          }
          case 'tan': {
            const angle = isDegree ? (arg * Math.PI) / 180 : arg;
            const cosVal = Math.cos(angle);
            if (Math.abs(cosVal) < 1e-15) {
              throw new Error("Tangent is undefined");
            }
            return Math.sin(angle) / cosVal;
          }
          case 'sqrt':
            if (arg < 0) {
              throw new Error("Square root of negative number");
            }
            return Math.sqrt(arg);
          case 'log':
            if (arg <= 0) {
              throw new Error("Logarithm of non-positive number");
            }
            return Math.log10(arg);
          case 'ln':
            if (arg <= 0) {
              throw new Error("Natural logarithm of non-positive number");
            }
            return Math.log(arg);
          case 'abs':
            return Math.abs(arg);
          case 'exp':
            return Math.exp(arg);
          default:
            throw new Error(`Unknown function: ${name}`);
        }
      }
    }

    throw new Error(`Unexpected character: ${char || 'end of input'}`);
  }

  const finalVal = parseExpression();
  if (pos < s.length) {
    throw new Error(`Invalid mathematical syntax at position ${pos + 1}`);
  }
  return finalVal;
}
