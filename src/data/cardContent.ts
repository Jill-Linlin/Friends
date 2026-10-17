/**
 * 賀卡內容設定檔：星夜風與時光機風共用。
 *
 * 填寫方式：直接把【待填：…】整段換成真正的內容即可。
 * 只要字串還是以「【待填」開頭，畫面上就會用醒目的樣式標示，方便檢查哪裡還沒填。
 */

/* ---------- 時光機：回憶考題的三種機關 ---------- */
export type Puzzle =
  /** 撥號盤：用老式電話撥號盤撥出一串數字 */
  | { type: 'dial'; question: string; answer: string; hint: string }
  /** 轉盤：轉動旋鈕選一個選項 */
  | { type: 'knob'; question: string; options: string[]; correctIndex: number; hint: string }
  /** 復古開關：把「真的有發生」的開關扳上去 */
  | { type: 'switches'; question: string; statements: string[]; correct: boolean[]; hint: string }

export interface Era {
  /** 年代名稱（顯示在儀表上，建議 2～3 個字） */
  label: string
  /** 年份（只能填數字，會顯示在年代計數器上） */
  year: string
  /** 解開考題後揭曉的回憶 */
  memory: string
  /** 這個年代的照片：放進 public/ 後填 '/檔名.jpg'，空字串會顯示預留框 */
  photo: string
  puzzle: Puzzle
}

const eras: Era[] = [
  {
    label: '高中',
    year: '2015',
    memory: '【待填：高中時期的回憶】',
    photo: '',
    puzzle: { type: 'dial', question: '【待填：例如「我們高中是哪一班？」（撥出班級號碼）】', answer: '307', hint: '【待填：答錯時的提示】' },
  },
  {
    label: '大學',
    year: '2018',
    memory: '【待填：大學時期的回憶】',
    photo: '',
    puzzle: {
      type: 'knob',
      question: '【待填：例如「大學時我們最常約在哪裡？」】',
      options: ['【待填：選項 A】', '【待填：選項 B】', '【待填：選項 C】', '【待填：選項 D】'],
      correctIndex: 1, // 從 0 開始算，1 代表第二個
      hint: '【待填：答錯時的吐槽】',
    },
  },
  {
    label: '出社會',
    year: '2022',
    memory: '【待填：出社會後的回憶】',
    photo: '',
    puzzle: {
      type: 'switches',
      question: '【待填：例如「出社會後，下面哪些事我們真的一起做過？」】',
      statements: ['【待填：事件一】', '【待填：事件二】', '【待填：事件三】', '【待填：事件四】'],
      correct: [true, false, true, false], // 對應上面每一件事：true = 真的有
      hint: '【待填：答錯時的提示】',
    },
  },
  {
    label: '現在',
    year: '2026',
    memory: '【待填：現在的我們，想對你說的話】',
    photo: '',
    puzzle: { type: 'dial', question: '【待填：例如「我們認識幾年了？」（撥出數字）】', answer: '10', hint: '【待填：答錯時的提示】' },
  },
]

export const content = {
  /** 收卡人（朋友）與寄件人（你） */
  friendName: '【待填：朋友的名字】',
  myName: '【待填：你的名字】',
  yearsTogether: '【待填：幾】',

  /** 星夜風的通關密語：answers 可放多種寫法，例如 ['友誼', '友情'] */
  password: {
    question: '【待填：只有你們知道答案的問題】',
    answers: ['友誼'],
    /** 答錯時依序顯示的提示（第一句由各風格自己決定，這裡是第二、三次答錯後的提示） */
    hints: ['提示：【待填：提示一】', '提示：【待填：提示二】'],
    /** 輸入框的灰色提示字，正式版建議改成空字串 */
    inputPlaceholder: '原型的答案是「友誼」',
  },

  /** 星夜第一站：高中學院（初遇） */
  school: {
    firstMeet: '【待填：初遇的回憶】',
    embarrassing: '【待填：高中的糗事】',
    graduation: '【待填：畢業那天】',
  },

  /** 星夜第二站：冒險森林（小測驗） */
  forest: {
    question: '【待填：問題，例如「那次我們一起做了什麼？」】',
    options: ['選項 A', '選項 B', '選項 C'],
    /** 正確選項的索引（從 0 開始算，1 代表第二個） */
    correctIndex: 1,
    /** 答錯時的吐槽 */
    wrongRoast: '【待填：答錯時的吐槽】',
    /** 答對後揭曉的故事 */
    story: '【待填：答對後揭曉的那段故事】',
  },

  /** 星夜第三站：遠方信塔（點亮 5 顆星，每顆一則訊息） */
  tower: {
    messages: [
      '【待填：分開後的第 1 則訊息】',
      '【待填：分開後的第 2 則訊息】',
      '【待填：分開後的第 3 則訊息】',
      '【待填：分開後的第 4 則訊息】',
      '【待填：分開後的第 5 則訊息】',
    ],
  },

  /** 星夜第四站：此刻之泉（現在的我們） */
  spring: {
    /** 照片路徑：把照片放進 public/ 資料夾，例如 public/us.jpg，這裡填 '/us.jpg'。空字串會顯示預留框 */
    photo: '',
    message: '【待填：現在的我們，想對你說的話】',
  },

  /** 時光機風 */
  timeMachine: {
    /** 開場的「時光座標密碼」：只能輸入數字，4 碼（年份）或 8 碼（年月日）都可以 */
    coordinate: {
      question: '【待填：例如「輸入我們第一次見面的那一天」】',
      answers: ['20150901'],
      /** 答錯時依序顯示 */
      hints: ['座標錯誤……時光迴路沒有反應。', '提示：【待填：提示一】', '提示：【待填：提示二】'],
      /** 原型測試用，正式版改成空字串 */
      prototypeNote: '原型密碼：20150901',
    },
    /** 時光迴廊裡的年代（可以增減，儀表會自動平均分配刻度） */
    eras,
    /** 時光膠囊幾年後開啟 */
    capsuleOpensInYears: 10,
  },

  /** 最後的信 */
  letter: {
    opening: '【待填：開頭，從高中那天說起】',
    middle: '【待填：中段，這些年你對我的意義】',
    closing: '【待填：結尾，對未來的祝福】',
    signature: '【待填：你的署名】',
    date: '【待填：日期】',
  },

  /** 結尾大標，例如「下一個十年也請多指教」 */
  finalLine: '【待填：最後一句話，例如「下一個十年也請多指教」】',
  /** 回信框的灰色提示字 */
  replyPlaceholder: '謝謝你一直都在',
}

export type CardContent = typeof content

/** 是否還是待填的佔位文字（用來加上醒目樣式） */
export const isTodo = (text: string) => text.startsWith('【待填')

/** 依答錯次數取得提示 */
export function hintFor(firstHint: string, wrongCount: number) {
  const all = [firstHint, ...content.password.hints]
  return all[Math.min(wrongCount, all.length - 1)]!
}

export const checkPassword = (v: string) => content.password.answers.includes(v.trim())
