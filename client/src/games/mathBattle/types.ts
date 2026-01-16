// 数字大战游戏类型定义
export interface MathBattleSettings {
    addition: { enabled: boolean; min: number; max: number };
    subtraction: { enabled: boolean; min: number; max: number };
    multiplication: { enabled: boolean; min: number; max: number };
    division: { enabled: boolean; min: number; max: number };
    speed: number;  // 前进速度 1-10
}

export const DEFAULT_SETTINGS: MathBattleSettings = {
    addition: { enabled: true, min: 1, max: 9 },
    subtraction: { enabled: false, min: 1, max: 9 },
    multiplication: { enabled: false, min: 1, max: 5 },
    division: { enabled: false, min: 1, max: 5 },
    speed: 5
};

export type OperatorType = '+' | '-' | '×' | '÷';

export interface GameQuestion {
    operator: OperatorType;
    operand: number;
    currentValue: number;
    correctAnswer: number;
    wrongAnswer: number;
}

// 生成运算问题
export function generateQuestion(
    currentValue: number,
    settings: MathBattleSettings
): GameQuestion | null {
    const enabledOperators: { op: OperatorType; min: number; max: number }[] = [];

    if (settings.addition.enabled) {
        enabledOperators.push({ op: '+', min: settings.addition.min, max: settings.addition.max });
    }
    if (settings.subtraction.enabled) {
        enabledOperators.push({ op: '-', min: settings.subtraction.min, max: settings.subtraction.max });
    }
    if (settings.multiplication.enabled) {
        enabledOperators.push({ op: '×', min: settings.multiplication.min, max: settings.multiplication.max });
    }
    if (settings.division.enabled) {
        enabledOperators.push({ op: '÷', min: settings.division.min, max: settings.division.max });
    }

    if (enabledOperators.length === 0) return null;

    // 随机选择运算符
    const selected = enabledOperators[Math.floor(Math.random() * enabledOperators.length)];
    let operand: number;
    let correctAnswer: number;

    // 根据运算符类型生成合适的操作数
    switch (selected.op) {
        case '+':
            operand = randomInt(selected.min, selected.max);
            correctAnswer = currentValue + operand;
            break;
        case '-':
            operand = Math.min(randomInt(selected.min, selected.max), currentValue); // 确保结果不为负
            correctAnswer = currentValue - operand;
            break;
        case '×':
            operand = randomInt(selected.min, selected.max);
            correctAnswer = currentValue * operand;
            break;
        case '÷':
            // 确保能整除
            const divisors = [];
            for (let i = selected.min; i <= selected.max; i++) {
                if (currentValue % i === 0) {
                    divisors.push(i);
                }
            }
            if (divisors.length === 0) {
                // 没有合适的除数，改用加法
                operand = randomInt(1, 5);
                correctAnswer = currentValue + operand;
                return {
                    operator: '+',
                    operand,
                    currentValue,
                    correctAnswer,
                    wrongAnswer: generateWrongAnswer(correctAnswer)
                };
            }
            operand = divisors[Math.floor(Math.random() * divisors.length)];
            correctAnswer = currentValue / operand;
            break;
        default:
            return null;
    }

    return {
        operator: selected.op,
        operand,
        currentValue,
        correctAnswer,
        wrongAnswer: generateWrongAnswer(correctAnswer)
    };
}

// 生成随机整数
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成错误答案
function generateWrongAnswer(correct: number): number {
    const offset = randomInt(1, Math.max(3, Math.floor(correct * 0.3)));
    return Math.random() > 0.5 ? correct + offset : Math.max(0, correct - offset);
}
