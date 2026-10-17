/**
 * 賀卡內容設定檔：魔法世界（星夜）與哆啦A夢世界（道具）共用。
 *
 * 填寫方式：直接把【待填：…】整段換成真正的內容即可。
 * 只要字串還是以「【待填」開頭，畫面上就會用醒目的樣式標示，方便檢查哪裡還沒填。
 */

/** 開場可選的兩個世界：magic → 魔法世界、gadget → 哆啦A夢道具世界 */
export type World = 'magic' | 'gadget'

export const content = {
  /** 開場選擇頁 */
  landing: {
    eyebrow: 'Choose your world',
    question: '以下世界你最想體驗下面哪一種？',
    subtitle: '選一扇門，故事就從那裡開始。',
    options: {
      magic: '哈利波特般的魔法世界',
      gadget: '有哆啦A夢的神奇道具',
    } satisfies Record<World, string>,
  },

  /** 收卡人 */
  friendName: '詹雨璇',

  /** 星夜風的通關密語：answers 可放多種寫法，例如 ['友誼', '友情'] */
  password: {
    question: '【待填：只有你們知道答案的問題】',
    answers: ['友誼'],
    /** 答錯時依序顯示的提示（第一句由各風格自己決定，這裡是第二、三次答錯後的提示） */
    hints: ['提示：【待填：提示一】', '提示：【待填：提示二】'],
    /** 輸入框的灰色提示字，正式版建議改成空字串 */
    inputPlaceholder: '原型的答案是「友誼」',
  },

  /** 星夜：拆開蠟封後的羊皮紙入學通知（看完後會燒掉，接著開始考試） */
  hogwarts: {
    school: '霍格華茲魔法與巫術學院',
    schoolLatin: 'Hogwarts School of Witchcraft and Wizardry',
    headmaster: '校長：阿不思·鄧不利多',
    greeting: '親愛的雨璇 女士：',
    body: [
      '我們愉快地通知您，您即將獲准在霍格華茲魔法與巫術學院就讀。隨信附上學前問卷，此問卷將決定入學資格。',
      '考試時間定於十月十九日開始。我們將靜候您的貓頭鷹帶來您的回信。',
    ],
    closingTitle: '副校長',
    signature: '麥米奈娃　謹上',
    /** 信打開後幾秒開始燃燒（燒完約 3 秒後進入考試） */
    burnAfterSeconds: 10,
  },

  /** 星夜結尾：入學典禮後出現一本封印中的「第二學年」魔法書，明年揭曉 */
  nextChapter: {
    title: '第二章　尚未揭曉',
    teaser: '有些魔法，要等到明年才會生效。',
    /** 揭曉日期（YYYY-MM-DD），畫面會倒數剩下幾天 */
    revealDate: '2027-10-19',
    /** 下一章的目錄：畫面上會被霧化、看不清楚，可以偷偷寫真正的線索 */
    secretContents: ['第一課　被遺忘的咒語', '第二課　禁忌森林的約定', '第三課　還沒寫下的冒險'],
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

  /** 哆啦A夢風：從抽屜跑出來的四次元口袋，依序拿出四個秘密道具 */
  gadget: {
    /** 任意門的通關密碼：只能輸入數字，4 碼（年份）或 8 碼（年月日）都可以 */
    door: {
      question: '【待填：例如「輸入我們第一次見面的那一天」】',
      answers: ['20150901'],
      /** 答錯時依序顯示 */
      hints: ['任意門打不開……座標好像不對。', '提示：【待填：提示一】', '提示：【待填：提示二】'],
      /** 原型測試用，正式版改成空字串 */
      prototypeNote: '原型密碼：20150901',
    },
    /** 道具一：時光機 → 回到高中（先答題，答對才看得到回憶） */
    timeMachine: {
      era: '高中',
      year: '2015',
      quiz: {
        question: '【待填：高中的考題，例如「我們第一次說話是在哪裡？」】',
        options: ['【待填：選項 A】', '【待填：選項 B】', '【待填：選項 C】'],
        correctIndex: 1, // 從 0 開始算，1 代表第二個
        wrongRoast: '【待填：答錯時的吐槽】',
      },
      memory: '【待填：高中時期的回憶】',
      /** 照片：放進 public/ 後填 '/檔名.jpg'，空字串會顯示預留框 */
      photo: '',
    },
    /** 道具二：記憶麵包 → 大學（回憶先印在吐司上、吃掉，再考考看記住了沒） */
    memoryBread: {
      era: '大學',
      year: '2018',
      memory: '【待填：大學時期的回憶（會印在吐司上）】',
      quiz: {
        question: '【待填：關於上面那段回憶的考題】',
        options: ['【待填：選項 A】', '【待填：選項 B】', '【待填：選項 C】'],
        correctIndex: 0,
        wrongRoast: '【待填：答錯時的吐槽】',
      },
    },
    /** 道具三：翻譯蒟蒻 → 出社會（一開始是亂碼，吃下蒟蒻後一則則翻譯出來） */
    konjac: {
      era: '出社會',
      year: '2022',
      messages: ['【待填：出社會後的訊息 1】', '【待填：出社會後的訊息 2】', '【待填：出社會後的訊息 3】'],
    },
    /** 道具四：竹蜻蜓 → 一路飛到現在 */
    bambooCopter: {
      era: '現在',
      year: '2026',
      message: '【待填：現在的我們，想對你說的話】',
      photo: '',
    },
    /** 結尾：口袋裡還有一個道具，要等明年才拿得出來 */
    nextGadget: {
      title: '下一個秘密道具　尚未揭曉',
      teaser: '口袋裡好像還有什麼東西……但要等到明年才拿得出來。',
      /** 揭曉日期（YYYY-MM-DD），畫面會倒數剩下幾天 */
      revealDate: '2027-10-19',
      /** 道具清單：畫面上會被霧化、看不清楚，可以偷偷寫真正的線索 */
      secretGadgets: ['一起去旅行的道具', '讓願望成真的道具', '還沒想好的驚喜'],
    },
  },

  /** 結尾前的小彩蛋：禮物裡的那枚戒指（兩個世界都會出現） */
  ring: {
    /** 戒指照片：放在 public/ 底下（想換更清楚的照片，直接覆蓋 public/ring.png 即可） */
    photo: '/ring.png',
    /** 魔法世界：發光的光球 */
    hint: '咦？好像有什麼東西在發光……',
    /** 哆啦A夢世界：發光的口袋，拿出來的道具名稱 */
    gadgetHint: '口袋裡好像有什麼在發光……！',
    gadgetName: '友情戒指',
    caption: 'TOY STORY',
    engraving: "YOU'VE GOT A FRIEND IN ME",
    translation: '你永遠有我這個朋友',
    message: [
      '這次的禮物裡，有一枚戒指。',
      '我挑它，是因為上面刻著這一句話——就像我們之間的友情。',
      '不管過了多久、走得多遠，妳都有我這個朋友。',
    ],
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
